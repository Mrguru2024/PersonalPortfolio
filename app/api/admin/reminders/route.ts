import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  runReminderEngine,
  getUserReminderRole,
} from "@server/services/reminderEngineService";

export const dynamic = "force-dynamic";

/** GET /api/admin/reminders — list reminders for current admin (new + snoozed due). Respects admin_settings.remindersEnabled. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;

    if (userId != null) {
      const settings = await storage.getAdminSettings(userId);
      if (settings?.remindersEnabled === false) {
        return NextResponse.json([]);
      }
    }

    const reminders = await storage.getAdminReminders({
      userId,
      includeSnoozedDue: true,
    });

    return NextResponse.json(reminders);
  } catch (e) {
    console.error("GET admin reminders error:", e);
    return NextResponse.json({ error: "Failed to load reminders" }, { status: 500 });
  }
}

/** POST /api/admin/reminders/generate — run reminder engine and persist. Idempotent. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    const userRole = getUserReminderRole(user ?? {});

    const result = await runReminderEngine(storage, { userId, userRole });

    // Optional: push notify admins when new reminders were created (only those with push enabled in admin settings)
    if (result.created > 0) {
      try {
        const { pushNotificationService } = await import("@server/services/pushNotificationService");
        const { pushSubscriptions } = await import("@shared/schema");
        const { db } = await import("@server/db");
        const subs = await db
          .select({ userId: pushSubscriptions.userId, endpoint: pushSubscriptions.endpoint, keys: pushSubscriptions.keys })
          .from(pushSubscriptions);
        const userIdsWithPushEnabled = new Set<number>();
        for (const s of subs) {
          const settings = await storage.getAdminSettings(s.userId);
          if (settings?.pushNotificationsEnabled !== false) userIdsWithPushEnabled.add(s.userId);
        }
        const payloads = subs
          .filter(
            (s) =>
              userIdsWithPushEnabled.has(s.userId) &&
              s.keys &&
              typeof s.keys === "object" &&
              "p256dh" in s.keys &&
              "auth" in s.keys
          )
          .map((s) => ({ endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } }));
        if (payloads.length > 0) {
          await pushNotificationService.sendToSubscriptions(payloads, {
            title: "Growth reminders",
            body: `${result.created} new reminder(s) need your attention`,
            tag: "admin-reminders",
          });
        }
      } catch (pushErr) {
        console.warn("Reminder push notification failed:", pushErr);
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("POST admin reminders generate error:", e);
    return NextResponse.json({ error: "Failed to generate reminders" }, { status: 500 });
  }
}
