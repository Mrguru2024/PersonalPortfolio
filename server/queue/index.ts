/**
 * Queue factory - creates Redis or Postgres adapter based on QUEUE_PROVIDER env
 * Falls back to Postgres if Redis is unavailable
 */

import { RedisQueueAdapter } from './redis-adapter';
import { PostgresQueueAdapter } from './postgres-adapter';
import type { QueueAdapter, QueueConfig } from './types';

let queueInstance: QueueAdapter | null = null;

export async function getQueueAdapter(): Promise<QueueAdapter> {
  if (queueInstance) {
    return queueInstance;
  }

  const provider = (process.env.QUEUE_PROVIDER || 'postgres') as 'redis' | 'postgres';

  if (provider === 'redis') {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        queueInstance = new RedisQueueAdapter({
          url: redisUrl,
          token: redisToken,
          keyPrefix: process.env.QUEUE_KEY_PREFIX || 'ascendra:queue',
        });

        console.log('✓ Queue adapter: Redis');
        return queueInstance;
      } catch (error) {
        console.warn('Redis queue unavailable, falling back to Postgres:', error);
      }
    } else {
      console.warn('Redis credentials missing, falling back to Postgres');
    }
  }

  queueInstance = new PostgresQueueAdapter({
    pollInterval: parseInt(process.env.QUEUE_POLL_INTERVAL || '1000', 10),
  });

  console.log('✓ Queue adapter: Postgres');
  return queueInstance;
}

export async function closeQueueAdapter(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}

/**
 * Queue worker - processes jobs from the queue
 */
export async function startQueueWorker(
  handlers: Record<string, (job: any) => Promise<void>>,
  options: { concurrency?: number; types?: string[] } = {}
): Promise<() => void> {
  const queue = await getQueueAdapter();
  const { concurrency = 1, types } = options;

  let running = true;
  const workers: Promise<void>[] = [];

  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (running) {
          try {
            const job = await queue.dequeue(types);

            if (!job) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            }

            const handler = handlers[job.type];
            if (!handler) {
              await queue.fail(job.id, `No handler for job type: ${job.type}`);
              continue;
            }

            try {
              await handler(job);
              await queue.complete(job.id);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              await queue.fail(job.id, errorMessage);
            }
          } catch (error) {
            console.error('Queue worker error:', error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      })()
    );
  }

  return () => {
    running = false;
  };
}
