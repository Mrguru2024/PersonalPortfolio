/**
 * Redis-backed queue adapter using Upstash Redis
 * Supports priority queues, delayed jobs, and retries
 */

import { Redis } from '@upstash/redis';
import type { QueueAdapter, QueueJob, EnqueueOptions } from './types';
import { v4 as uuidv4 } from 'uuid';

export class RedisQueueAdapter implements QueueAdapter {
  private redis: Redis;
  private keyPrefix: string;

  constructor(config: { url: string; token: string; keyPrefix?: string }) {
    this.redis = new Redis({
      url: config.url,
      token: config.token,
    });
    this.keyPrefix = config.keyPrefix || 'queue';
  }

  private getJobKey(jobId: string): string {
    return `${this.keyPrefix}:job:${jobId}`;
  }

  private getQueueKey(priority: number = 0): string {
    return `${this.keyPrefix}:pending:${priority}`;
  }

  private getDelayedKey(): string {
    return `${this.keyPrefix}:delayed`;
  }

  private getProcessingKey(): string {
    return `${this.keyPrefix}:processing`;
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
      processAfter: options.delay ? new Date(Date.now() + options.delay) : undefined,
    };

    await this.redis.set(this.getJobKey(job.id), JSON.stringify(job));

    if (job.processAfter) {
      await this.redis.zadd(this.getDelayedKey(), {
        score: job.processAfter.getTime(),
        member: job.id,
      });
    } else {
      await this.redis.zadd(this.getQueueKey(job.priority!), {
        score: Date.now(),
        member: job.id,
      });
    }

    return job;
  }

  async dequeue(types?: string[]): Promise<QueueJob | null> {
    await this.moveDelayedJobs();

    const priorities = [10, 5, 1, 0];
    for (const priority of priorities) {
      const queueKey = this.getQueueKey(priority);
      const jobIds = await this.redis.zrange<string[]>(queueKey, 0, 0);

      if (jobIds && jobIds.length > 0) {
        const jobId = jobIds[0];
        const jobData = await this.redis.get<string>(this.getJobKey(jobId));

        if (!jobData) {
          await this.redis.zrem(queueKey, jobId);
          continue;
        }

        const job = JSON.parse(jobData) as QueueJob;

        if (types && !types.includes(job.type)) {
          continue;
        }

        await this.redis.zrem(queueKey, jobId);
        await this.redis.zadd(this.getProcessingKey(), {
          score: Date.now(),
          member: jobId,
        });

        job.attempts = (job.attempts || 0) + 1;
        await this.redis.set(this.getJobKey(jobId), JSON.stringify(job));

        return job;
      }
    }

    return null;
  }

  private async moveDelayedJobs(): Promise<void> {
    const now = Date.now();
    const jobIds = await this.redis.zrange<string[]>(this.getDelayedKey(), 0, now, {
      byScore: true,
    });

    if (!jobIds || jobIds.length === 0) return;

    for (const jobId of jobIds) {
      const jobData = await this.redis.get<string>(this.getJobKey(jobId));
      if (!jobData) continue;

      const job = JSON.parse(jobData) as QueueJob;
      await this.redis.zadd(this.getQueueKey(job.priority || 0), {
        score: Date.now(),
        member: jobId,
      });
      await this.redis.zrem(this.getDelayedKey(), jobId);
    }
  }

  async complete(jobId: string, result?: unknown): Promise<void> {
    const jobData = await this.redis.get<string>(this.getJobKey(jobId));
    if (!jobData) return;

    const job = JSON.parse(jobData) as QueueJob;
    job.completedAt = new Date();

    await this.redis.set(this.getJobKey(jobId), JSON.stringify(job), { ex: 86400 });
    await this.redis.zrem(this.getProcessingKey(), jobId);
  }

  async fail(jobId: string, error: string): Promise<void> {
    const jobData = await this.redis.get<string>(this.getJobKey(jobId));
    if (!jobData) return;

    const job = JSON.parse(jobData) as QueueJob;
    job.error = error;

    if (job.attempts! < job.maxAttempts!) {
      await this.retry(jobId, Math.pow(2, job.attempts!) * 1000);
    } else {
      job.failedAt = new Date();
      await this.redis.set(this.getJobKey(jobId), JSON.stringify(job));
      await this.redis.zrem(this.getProcessingKey(), jobId);
    }
  }

  async retry(jobId: string, delay: number = 0): Promise<void> {
    const jobData = await this.redis.get<string>(this.getJobKey(jobId));
    if (!jobData) return;

    const job = JSON.parse(jobData) as QueueJob;
    await this.redis.zrem(this.getProcessingKey(), jobId);

    if (delay > 0) {
      await this.redis.zadd(this.getDelayedKey(), {
        score: Date.now() + delay,
        member: jobId,
      });
    } else {
      await this.redis.zadd(this.getQueueKey(job.priority || 0), {
        score: Date.now(),
        member: jobId,
      });
    }
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    const jobData = await this.redis.get<string>(this.getJobKey(jobId));
    return jobData ? JSON.parse(jobData) : null;
  }

  async getPendingCount(type?: string): Promise<number> {
    const priorities = [10, 5, 1, 0];
    let total = 0;

    for (const priority of priorities) {
      const count = await this.redis.zcard(this.getQueueKey(priority));
      total += count;
    }

    const delayedCount = await this.redis.zcard(this.getDelayedKey());
    total += delayedCount;

    return total;
  }

  async getFailedJobs(limit: number = 10): Promise<QueueJob[]> {
    return [];
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
    const priorities = [10, 5, 1, 0];
    let purged = 0;

    for (const priority of priorities) {
      const queueKey = this.getQueueKey(priority);
      const count = await this.redis.zremrangebyscore(queueKey, 0, Date.now() - 86400000);
      purged += count;
    }

    return purged;
  }

  async close(): Promise<void> {
  }
}
