/**
 * Enterprise backup and restore service
 * Manages database backups, restore drills, and disaster recovery
 */

import { db } from '../db';
import { enterpriseBackups as enterpriseBackupsTable } from '../../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface BackupOptions {
  backupType: 'full' | 'incremental' | 'schema-only' | 'data-only';
  compression?: boolean;
  location?: string;
  metadata?: Record<string, unknown>;
}

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  dryRun?: boolean;
}

class EnterpriseBackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/var/backups/ascendra';
  }

  /**
   * Create a database backup
   */
  async createBackup(options: BackupOptions): Promise<string> {
    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}-${backupId}.sql${options.compression ? '.gz' : ''}`;
    const fullPath = path.join(this.backupDir, filename);

    const [backup] = await db
      .insert(enterpriseBackupsTable)
      .values({
        backupId,
        backupType: options.backupType,
        status: 'in_progress',
        location: fullPath,
        metadata: options.metadata || null,
        createdAt: new Date(),
      })
      .returning();

    try {
      await fs.mkdir(this.backupDir, { recursive: true });

      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const url = new URL(dbUrl.replace(/^postgres:/, 'postgresql:'));
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const user = url.username;
      const password = url.password;

      let pgDumpArgs = `-h ${host} -p ${port} -U ${user} -d ${database} -F p`;

      switch (options.backupType) {
        case 'schema-only':
          pgDumpArgs += ' --schema-only';
          break;
        case 'data-only':
          pgDumpArgs += ' --data-only';
          break;
      }

      const command = options.compression
        ? `PGPASSWORD='${password}' pg_dump ${pgDumpArgs} | gzip > ${fullPath}`
        : `PGPASSWORD='${password}' pg_dump ${pgDumpArgs} > ${fullPath}`;

      await execAsync(command);

      const stats = await fs.stat(fullPath);

      await db
        .update(enterpriseBackupsTable)
        .set({
          status: 'completed',
          size: stats.size,
          completedAt: new Date(),
        })
        .where(eq(enterpriseBackupsTable.backupId, backupId));

      console.log(`✓ Backup created: ${backupId} (${stats.size} bytes)`);
      return backupId;
    } catch (error) {
      await db
        .update(enterpriseBackupsTable)
        .set({
          status: 'failed',
          metadata: {
            ...options.metadata,
            error: error instanceof Error ? error.message : String(error),
          },
        })
        .where(eq(enterpriseBackupsTable.backupId, backupId));

      throw error;
    }
  }

  /**
   * Restore from a backup
   */
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const backupResult = await db
      .select()
      .from(enterpriseBackupsTable)
      .where(eq(enterpriseBackupsTable.backupId, options.backupId))
      .limit(1);

    const backup = backupResult[0];

    if (!backup || !backup.location) {
      throw new Error(`Backup ${options.backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup ${options.backupId} is not in completed state`);
    }

    const dbUrl = options.targetDatabase || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(dbUrl.replace(/^postgres:/, 'postgresql:'));
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const user = url.username;
    const password = url.password;

    if (options.dryRun) {
      console.log(`[DRY RUN] Would restore ${backup.location} to ${database}`);
      return;
    }

    const isCompressed = backup.location.endsWith('.gz');
    const command = isCompressed
      ? `gunzip -c ${backup.location} | PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${database}`
      : `PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${database} < ${backup.location}`;

    await execAsync(command);

    console.log(`✓ Restored backup: ${options.backupId}`);
  }

  /**
   * Run a restore drill (test restore to temporary database)
   */
  async runRestoreDrill(backupId: string): Promise<{
    success: boolean;
    duration: number;
    errors?: string[];
  }> {
    const startTime = Date.now();
    const tempDb = `restore_drill_${Date.now()}`;

    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const url = new URL(dbUrl.replace(/^postgres:/, 'postgresql:'));
      const host = url.hostname;
      const port = url.port || '5432';
      const user = url.username;
      const password = url.password;

      await execAsync(
        `PGPASSWORD='${password}' createdb -h ${host} -p ${port} -U ${user} ${tempDb}`
      );

      await this.restoreBackup({
        backupId,
        targetDatabase: `postgresql://${user}:${password}@${host}:${port}/${tempDb}`,
        dryRun: false,
      });

      const { stdout } = await execAsync(
        `PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${user} -d ${tempDb} -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"`
      );

      await execAsync(
        `PGPASSWORD='${password}' dropdb -h ${host} -p ${port} -U ${user} ${tempDb}`
      );

      const duration = Date.now() - startTime;
      console.log(`✓ Restore drill successful: ${backupId} (${duration}ms)`);

      return { success: true, duration };
    } catch (error) {
      try {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
          const url = new URL(dbUrl.replace(/^postgres:/, 'postgresql:'));
          await execAsync(
            `PGPASSWORD='${url.password}' dropdb -h ${url.hostname} -p ${url.port || '5432'} -U ${url.username} ${tempDb} 2>/dev/null || true`
          );
        }
      } catch {}

      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * List all backups
   */
  async listBackups(limit = 50): Promise<any[]> {
    return await db
      .select()
      .from(enterpriseBackupsTable)
      .orderBy(sql`${enterpriseBackupsTable.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(retentionDays = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 86400000);

    const oldBackups = await db
      .select()
      .from(enterpriseBackupsTable)
      .where(sql`${enterpriseBackupsTable.createdAt} < ${cutoffDate}`);

    for (const backup of oldBackups) {
      if (backup.location) {
        try {
          await fs.unlink(backup.location);
        } catch (error) {
          console.warn(`Failed to delete backup file: ${backup.location}`, error);
        }
      }
    }

    const result = await db
      .delete(enterpriseBackupsTable)
      .where(sql`${enterpriseBackupsTable.createdAt} < ${cutoffDate}`);

    return result.rowCount || 0;
  }
}

export const enterpriseBackupService = new EnterpriseBackupService();
