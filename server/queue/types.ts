/**
 * Queue adapter types for Redis and Postgres-backed job queues
 */

export interface QueueJob<T = unknown> {
  id: string;
  type: string;
  data: T;
  priority?: number;
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  processAfter?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export interface QueueAdapter {
  enqueue<T>(type: string, data: T, options?: EnqueueOptions): Promise<QueueJob<T>>;
  dequeue(types?: string[]): Promise<QueueJob | null>;
  complete(jobId: string, result?: unknown): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
  retry(jobId: string, delay?: number): Promise<void>;
  getJob(jobId: string): Promise<QueueJob | null>;
  getPendingCount(type?: string): Promise<number>;
  getFailedJobs(limit?: number): Promise<QueueJob[]>;
  drain(maxJobs?: number): Promise<number>;
  purge(olderThan?: Date): Promise<number>;
  close(): Promise<void>;
}

export interface EnqueueOptions {
  priority?: number;
  delay?: number;
  maxAttempts?: number;
}

export interface QueueConfig {
  provider: 'redis' | 'postgres';
  redis?: {
    url: string;
    keyPrefix?: string;
  };
  postgres?: {
    connectionString: string;
  };
  pollInterval?: number;
  maxConcurrency?: number;
}
