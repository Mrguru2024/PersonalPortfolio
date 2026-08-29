/**
 * Enterprise AI policy enforcement
 * Manages organization-level AI controls, rate limiting, and audit logging
 */

import { db } from '../db';
import { enterpriseAiPolicy as enterpriseAiPolicyTable, enterpriseAiAuditLog } from '../../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface AiPolicyConfig {
  aiEnabled: boolean;
  allowedModels?: string[];
  rateLimitPerUser?: number;
  rateLimitWindow?: number;
  dataRetentionDays?: number;
  auditLogEnabled?: boolean;
}

export interface AiUsageContext {
  orgId: string;
  userId: number;
  model: string;
  action: string;
  tokensUsed?: number;
}

class EnterpriseAiPolicyService {
  private rateLimiters: Map<string, Ratelimit> = new Map();
  private redis: Redis | null = null;

  constructor() {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  }

  /**
   * Get or create AI policy for an organization
   */
  async getPolicy(orgId: string): Promise<AiPolicyConfig> {
    const policyResult = await db
      .select()
      .from(enterpriseAiPolicyTable)
      .where(eq(enterpriseAiPolicyTable.orgId, orgId))
      .limit(1);

    const policy = policyResult[0];

    if (!policy) {
      const newPolicyResult = await db
        .insert(enterpriseAiPolicyTable)
        .values({
          orgId,
          aiEnabled: true,
          rateLimitPerUser: 100,
          rateLimitWindow: 3600,
          dataRetentionDays: 30,
          auditLogEnabled: true,
        })
        .returning();

      const newPolicy = newPolicyResult[0];

      return {
        aiEnabled: newPolicy.aiEnabled,
        allowedModels: newPolicy.allowedModels || undefined,
        rateLimitPerUser: newPolicy.rateLimitPerUser || 100,
        rateLimitWindow: newPolicy.rateLimitWindow || 3600,
        dataRetentionDays: newPolicy.dataRetentionDays || 30,
        auditLogEnabled: newPolicy.auditLogEnabled,
      };
    }

    return {
      aiEnabled: policy.aiEnabled,
      allowedModels: policy.allowedModels || undefined,
      rateLimitPerUser: policy.rateLimitPerUser || 100,
      rateLimitWindow: policy.rateLimitWindow || 3600,
      dataRetentionDays: policy.dataRetentionDays || 30,
      auditLogEnabled: policy.auditLogEnabled,
    };
  }

  /**
   * Update AI policy for an organization
   */
  async updatePolicy(orgId: string, config: Partial<AiPolicyConfig>): Promise<void> {
    await db
      .insert(enterpriseAiPolicyTable)
      .values({
        orgId,
        ...config,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: enterpriseAiPolicyTable.orgId,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      });

    if (this.rateLimiters.has(orgId)) {
      this.rateLimiters.delete(orgId);
    }
  }

  /**
   * Check if AI request is allowed and enforce rate limits
   */
  async checkAndEnforcePolicy(context: AiUsageContext): Promise<{
    allowed: boolean;
    reason?: string;
    remaining?: number;
  }> {
    const policy = await this.getPolicy(context.orgId);

    if (!policy.aiEnabled) {
      await this.logUsage({ ...context, success: false, errorMessage: 'AI disabled by policy' });
      return { allowed: false, reason: 'AI is disabled for this organization' };
    }

    if (policy.allowedModels && !policy.allowedModels.includes(context.model)) {
      await this.logUsage({ ...context, success: false, errorMessage: 'Model not allowed' });
      return {
        allowed: false,
        reason: `Model "${context.model}" is not allowed by organization policy`,
      };
    }

    if (this.redis && policy.rateLimitPerUser) {
      const rateLimiter = this.getRateLimiter(
        context.orgId,
        policy.rateLimitPerUser,
        policy.rateLimitWindow || 3600
      );

      const { success, remaining } = await rateLimiter.limit(
        `ai:${context.orgId}:${context.userId}`
      );

      if (!success) {
        await this.logUsage({ ...context, success: false, errorMessage: 'Rate limit exceeded' });
        return { allowed: false, reason: 'Rate limit exceeded', remaining };
      }

      return { allowed: true, remaining };
    }

    return { allowed: true };
  }

  /**
   * Log AI usage for audit
   */
  async logUsage(context: AiUsageContext & { success: boolean; errorMessage?: string }): Promise<void> {
    const policy = await this.getPolicy(context.orgId);

    if (!policy.auditLogEnabled) {
      return;
    }

    await db.insert(enterpriseAiAuditLog).values({
      orgId: context.orgId,
      userId: context.userId,
      action: context.action,
      model: context.model,
      tokensUsed: context.tokensUsed,
      success: context.success,
      errorMessage: context.errorMessage,
      createdAt: new Date(),
    });
  }

  /**
   * Get usage statistics for an organization
   */
  async getUsageStats(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
    byModel: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const whereClause = startDate && endDate
      ? and(
          eq(enterpriseAiAuditLog.orgId, orgId),
          gte(enterpriseAiAuditLog.createdAt, startDate),
          sql`${enterpriseAiAuditLog.createdAt} <= ${endDate}`
        )
      : eq(enterpriseAiAuditLog.orgId, orgId);

    const logs = await db
      .select()
      .from(enterpriseAiAuditLog)
      .where(whereClause);

    const stats = {
      totalRequests: logs.length,
      successfulRequests: logs.filter((l: any) => l.success).length,
      failedRequests: logs.filter((l: any) => !l.success).length,
      totalTokens: logs.reduce((sum: number, l: any) => sum + (l.tokensUsed || 0), 0),
      byModel: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
    };

    for (const log of logs) {
      if (log.model) {
        stats.byModel[log.model] = (stats.byModel[log.model] || 0) + 1;
      }
      if (log.userId) {
        stats.byUser[String(log.userId)] = (stats.byUser[String(log.userId)] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupAuditLogs(orgId: string): Promise<number> {
    const policy = await this.getPolicy(orgId);
    const cutoffDate = new Date(Date.now() - (policy.dataRetentionDays || 30) * 86400000);

    const result = await db
      .delete(enterpriseAiAuditLog)
      .where(
        and(
          eq(enterpriseAiAuditLog.orgId, orgId),
          sql`${enterpriseAiAuditLog.createdAt} < ${cutoffDate}`
        )
      );

    return result.rowCount || 0;
  }

  /**
   * Get or create rate limiter for an organization
   */
  private getRateLimiter(orgId: string, limit: number, window: number): Ratelimit {
    const key = `${orgId}:${limit}:${window}`;

    if (!this.rateLimiters.has(key) && this.redis) {
      this.rateLimiters.set(
        key,
        new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(limit, `${window} s`),
          prefix: `enterprise:ai:ratelimit`,
        })
      );
    }

    return this.rateLimiters.get(key)!;
  }
}

export const enterpriseAiPolicyService = new EnterpriseAiPolicyService();
