/**
 * Real-time collaboration service
 * Manages user presence, live markup, and pub/sub broadcasting
 */

import { db } from '../db';
import { collaborationPresence, collaborationMarkup, users } from '../../shared/schema';
import { eq, and, sql, gt } from 'drizzle-orm';
import { WebSocket } from 'ws';

export interface PresenceUpdate {
  userId: number;
  resourceType: string;
  resourceId: string;
  cursorPosition?: { line?: number; column?: number; x?: number; y?: number };
  color: string;
  metadata?: Record<string, unknown>;
}

export interface MarkupEvent {
  userId: number;
  resourceType: string;
  resourceId: string;
  markupType: string;
  content: string;
  position?: Record<string, unknown>;
}

export interface CollaborationMessage {
  type: 'presence' | 'markup' | 'cursor' | 'selection';
  resourceType: string;
  resourceId: string;
  userId: number;
  username?: string;
  data: unknown;
  timestamp: string;
}

class CollaborationService {
  private subscribers: Map<string, Set<WebSocket>> = new Map();
  private presenceCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPresenceCleanup();
  }

  /**
   * Subscribe a WebSocket connection to resource updates
   */
  subscribe(resourceKey: string, ws: WebSocket): void {
    if (!this.subscribers.has(resourceKey)) {
      this.subscribers.set(resourceKey, new Set());
    }
    this.subscribers.get(resourceKey)!.add(ws);

    ws.on('close', () => {
      this.unsubscribe(resourceKey, ws);
    });
  }

  /**
   * Unsubscribe a WebSocket connection
   */
  unsubscribe(resourceKey: string, ws: WebSocket): void {
    const subs = this.subscribers.get(resourceKey);
    if (subs) {
      subs.delete(ws);
      if (subs.size === 0) {
        this.subscribers.delete(resourceKey);
      }
    }
  }

  /**
   * Broadcast message to all subscribers of a resource
   */
  broadcast(resourceKey: string, message: CollaborationMessage, excludeWs?: WebSocket): void {
    const subs = this.subscribers.get(resourceKey);
    if (!subs) return;

    const payload = JSON.stringify(message);
    for (const ws of subs) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  /**
   * Update user presence on a resource
   */
  async updatePresence(update: PresenceUpdate): Promise<void> {
    const resourceKey = `${update.resourceType}:${update.resourceId}`;

    await db
      .insert(collaborationPresence)
      .values({
        userId: update.userId,
        resourceType: update.resourceType,
        resourceId: update.resourceId,
        cursorPosition: update.cursorPosition || null,
        color: update.color,
        lastSeenAt: new Date(),
        metadata: update.metadata || null,
      })
      .onConflictDoUpdate({
        target: [collaborationPresence.userId, collaborationPresence.resourceType, collaborationPresence.resourceId],
        set: {
          cursorPosition: update.cursorPosition || null,
          lastSeenAt: new Date(),
          metadata: update.metadata || null,
        },
      });

    const userResult = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, update.userId))
      .limit(1);
    const user = userResult[0];

    this.broadcast(resourceKey, {
      type: 'presence',
      resourceType: update.resourceType,
      resourceId: update.resourceId,
      userId: update.userId,
      username: user?.username,
      data: update,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove user presence from a resource
   */
  async removePresence(userId: number, resourceType: string, resourceId: string): Promise<void> {
    await db
      .delete(collaborationPresence)
      .where(
        and(
          eq(collaborationPresence.userId, userId),
          eq(collaborationPresence.resourceType, resourceType),
          eq(collaborationPresence.resourceId, resourceId)
        )
      );

    const resourceKey = `${resourceType}:${resourceId}`;
    this.broadcast(resourceKey, {
      type: 'presence',
      resourceType,
      resourceId,
      userId,
      data: { removed: true },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get active users on a resource
   */
  async getPresence(resourceType: string, resourceId: string): Promise<PresenceUpdate[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const presence = await db
      .select()
      .from(collaborationPresence)
      .where(
        and(
          eq(collaborationPresence.resourceType, resourceType),
          eq(collaborationPresence.resourceId, resourceId),
          gt(collaborationPresence.lastSeenAt, fiveMinutesAgo)
        )
      );

    return presence.map((p) => ({
      userId: p.userId,
      resourceType: p.resourceType,
      resourceId: p.resourceId,
      cursorPosition: p.cursorPosition || undefined,
      color: p.color,
      metadata: p.metadata || undefined,
    }));
  }

  /**
   * Create a markup/comment
   */
  async createMarkup(markup: MarkupEvent): Promise<number> {
    const [result] = await db
      .insert(collaborationMarkup)
      .values({
        userId: markup.userId,
        resourceType: markup.resourceType,
        resourceId: markup.resourceId,
        markupType: markup.markupType,
        content: markup.content,
        position: markup.position || null,
      })
      .returning({ id: collaborationMarkup.id });

    const resourceKey = `${markup.resourceType}:${markup.resourceId}`;
    const userResult = await db.select({ username: users.username })
      .from(users)
      .where(eq(users.id, markup.userId))
      .limit(1);
    const user = userResult[0];

    this.broadcast(resourceKey, {
      type: 'markup',
      resourceType: markup.resourceType,
      resourceId: markup.resourceId,
      userId: markup.userId,
      username: user?.username,
      data: { ...markup, id: result.id },
      timestamp: new Date().toISOString(),
    });

    return result.id;
  }

  /**
   * Resolve a markup/comment
   */
  async resolveMarkup(markupId: number, userId: number): Promise<void> {
    const markupResult = await db
      .select()
      .from(collaborationMarkup)
      .where(eq(collaborationMarkup.id, markupId))
      .limit(1);

    const markup = markupResult[0];
    if (!markup) return;

    await db
      .update(collaborationMarkup)
      .set({
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
      })
      .where(eq(collaborationMarkup.id, markupId));

    const resourceKey = `${markup.resourceType}:${markup.resourceId}`;
    this.broadcast(resourceKey, {
      type: 'markup',
      resourceType: markup.resourceType,
      resourceId: markup.resourceId,
      userId,
      data: { id: markupId, resolved: true },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get all markup for a resource
   */
  async getMarkup(resourceType: string, resourceId: string, includeResolved = false): Promise<any[]> {
    const whereClause = includeResolved
      ? and(
          eq(collaborationMarkup.resourceType, resourceType),
          eq(collaborationMarkup.resourceId, resourceId)
        )
      : and(
          eq(collaborationMarkup.resourceType, resourceType),
          eq(collaborationMarkup.resourceId, resourceId),
          eq(collaborationMarkup.resolved, false)
        );

    return await db
      .select()
      .from(collaborationMarkup)
      .where(whereClause)
      .orderBy(sql`${collaborationMarkup.createdAt} DESC`);
  }

  /**
   * Clean up stale presence records
   */
  private startPresenceCleanup(): void {
    this.presenceCleanupInterval = setInterval(async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      await db
        .delete(collaborationPresence)
        .where(sql`${collaborationPresence.lastSeenAt} < ${fiveMinutesAgo}`);
    }, 60000);
  }

  /**
   * Stop the service and cleanup
   */
  stop(): void {
    if (this.presenceCleanupInterval) {
      clearInterval(this.presenceCleanupInterval);
    }

    for (const [, subs] of this.subscribers) {
      for (const ws of subs) {
        ws.close();
      }
    }
    this.subscribers.clear();
  }
}

export const collaborationService = new CollaborationService();
