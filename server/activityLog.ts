/**
 * User activity / audit log for admin monitoring.
 * Records login success/failure, logout, and errors (persisted to DB).
 * Also mirrors to the in-memory system monitor so /admin/system shows recent auth events on the same instance.
 */

import { db } from "@server/db";
import { userActivityLog, type InsertUserActivityLog } from "@shared/schema";
import { captureActivity } from "@/lib/systemMonitor";

export type ActivityEventType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "error"
  | "client_error";

export interface RecordActivityOptions {
  userId?: number | null;
  message?: string | null;
  identifier?: string | null; // e.g. username/email for failed login
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordActivityLog(
  eventType: ActivityEventType,
  success: boolean,
  options: RecordActivityOptions = {}
): Promise<void> {
  try {
    const ipAddress = options.ipAddress ?? null;
    const userAgent = options.userAgent ?? null;
    const message =
      options.message != null && options.message.length > 0
        ? options.message.slice(0, 2000)
        : null;
    const identifier =
      options.identifier != null && options.identifier.length > 0
        ? options.identifier.slice(0, 500)
        : null;

    await db.insert(userActivityLog).values({
      userId: options.userId ?? null,
      eventType,
      success,
      message,
      identifier,
      ipAddress,
      userAgent: userAgent ? userAgent.slice(0, 500) : null,
      metadata: options.metadata ?? null,
    } as InsertUserActivityLog);

    const who =
      identifier ??
      (options.userId != null ? `userId=${options.userId}` : "anonymous");
    captureActivity({
      message: `${eventType} · ${who}${message ? ` · ${message.slice(0, 120)}` : ""}`,
      route: "user_activity_log",
      method: eventType,
      status: success ? 200 : 401,
      userId: options.userId != null ? String(options.userId) : undefined,
    });
  } catch (e) {
    console.error("Activity log insert failed:", e);
  }
}
