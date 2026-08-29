/**
 * Postgres-backed queue adapter as fallback when Redis is unavailable
 * Uses polling with advisory locks for concurrency control
 */

import { sql } from 'drizzle-orm';
import { db } from '../db';
import type { QueueAdapter, QueueJob, EnqueueOptions } from './types';
import { v4 as uuidv4 } from 'uuid';

export class PostgresQueueAdapter implements QueueAdapter {
  private pollInterval: number;

  constructor(config: { pollInterval?: number } = {}) {
    this.pollInterval = config.pollInterval || 1000;
  }

  async enqueue<T>(
    type: string,
    data: T,
    options: EnqueueOptions = {}
  ): Promise<QueueJob<T>> {
    const job: QueueJob<T> = {
      id: uuidv4(),
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
      processAfter: options.delay ? new Date(Date.now() + options.delay) : new Date(),
    };

    await db.execute(sql`
      INSERT INTO queue_jobs (
        id, type, data, priority, attempts, max_attempts, created_at, process_after, status
      ) VALUES (
        ${job.id},
        ${job.type},
        ${JSON.stringify(job.data)},
        ${job.priority},
        ${job.attempts},
        ${job.maxAttempts},
        ${job.createdAt.toISOString()},
        ${job.processAfter!.toISOString()},
        'pending'
      )
    `);

    return job;
  }

  async dequeue(types?: string[]): Promise<QueueJob | null> {
    const typeFilter = types ? sql`AND type = ANY(${types})` : sql``;

    const result = await db.execute<{ id: string; type: string; data: string; priority: number; attempts: number; maxAttempts: number; createdAt: string; processAfter: string; completedAt: string | null; failedAt: string | null; error: string | null }>(sql`
      UPDATE queue_jobs
      SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
      WHERE id = (
        SELECT id FROM queue_jobs
        WHERE status = 'pending'
          AND process_after <= NOW()
          ${typeFilter}
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        type,
        data,
        priority,
        attempts,
        max_attempts as "maxAttempts",
        created_at as "createdAt",
        process_after as "processAfter",
        completed_at as "completedAt",
        failed_at as "failedAt",
        error
    `);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data as string) : row.data,
      createdAt: new Date(row.createdAt),
      processAfter: row.processAfter ? new Date(row.processAfter) : undefined,
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
      error: row.error || undefined,
    };
  }

  async complete(jobId: string, result?: unknown): Promise<void> {
    await db.execute(sql`
      UPDATE queue_jobs
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `);
  }

  async fail(jobId: string, error: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    if (job.attempts! < job.maxAttempts!) {
      const delay = Math.pow(2, job.attempts!) * 1000;
      await this.retry(jobId, delay);
    } else {
      await db.execute(sql`
        UPDATE queue_jobs
        SET status = 'failed', failed_at = NOW(), error = ${error}, updated_at = NOW()
        WHERE id = ${jobId}
      `);
    }
  }

  async retry(jobId: string, delay: number = 0): Promise<void> {
    const processAfter = new Date(Date.now() + delay);
    await db.execute(sql`
      UPDATE queue_jobs
      SET status = 'pending', process_after = ${processAfter.toISOString()}, updated_at = NOW()
      WHERE id = ${jobId}
    `);
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    const result = await db.execute<{ id: string; type: string; data: string; priority: number; attempts: number; maxAttempts: number; createdAt: string; processAfter: string; completedAt: string | null; failedAt: string | null; error: string | null }>(sql`
      SELECT
        id,
        type,
        data,
        priority,
        attempts,
        max_attempts as "maxAttempts",
        created_at as "createdAt",
        process_after as "processAfter",
        completed_at as "completedAt",
        failed_at as "failedAt",
        error
      FROM queue_jobs
      WHERE id = ${jobId}
    `);

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data as string) : row.data,
      createdAt: new Date(row.createdAt),
      processAfter: row.processAfter ? new Date(row.processAfter) : undefined,
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
      error: row.error || undefined,
    };
  }

  async getPendingCount(type?: string): Promise<number> {
    const typeFilter = type ? sql`AND type = ${type}` : sql``;

    const result = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM queue_jobs
      WHERE status = 'pending' ${typeFilter}
    `);

    return result.rows?.[0]?.count || 0;
  }

  async getFailedJobs(limit: number = 10): Promise<QueueJob[]> {
    const result = await db.execute<{ id: string; type: string; data: string; priority: number; attempts: number; maxAttempts: number; createdAt: string; processAfter: string; completedAt: string | null; failedAt: string | null; error: string | null }>(sql`
      SELECT
        id,
        type,
        data,
        priority,
        attempts,
        max_attempts as "maxAttempts",
        created_at as "createdAt",
        process_after as "processAfter",
        completed_at as "completedAt",
        failed_at as "failedAt",
        error
      FROM queue_jobs
      WHERE status = 'failed'
      ORDER BY failed_at DESC
      LIMIT ${limit}
    `);

    return (result.rows || []).map((row) => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data as string) : row.data,
      createdAt: new Date(row.createdAt),
      processAfter: row.processAfter ? new Date(row.processAfter) : undefined,
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
      error: row.error || undefined,
    }));
  }

  async drain(maxJobs: number = 100): Promise<number> {
    let drained = 0;

    while (drained < maxJobs) {
      const job = await this.dequeue();
      if (!job) break;

      await this.complete(job.id);
      drained++;
    }

    return drained;
  }

  async purge(olderThan?: Date): Promise<number> {
    const cutoff = olderThan || new Date(Date.now() - 7 * 86400000);

    const result = await db.execute<{ count: number }>(sql`
      WITH deleted AS (
        DELETE FROM queue_jobs
        WHERE (status = 'completed' OR status = 'failed')
          AND updated_at < ${cutoff.toISOString()}
        RETURNING id
      )
      SELECT COUNT(*) as count FROM deleted
    `);

    return result.rows?.[0]?.count || 0;
  }

  async close(): Promise<void> {
  }
}
