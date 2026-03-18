import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  emailNotifications: true,
  inAppNotifications: true,
  pushNotificationsEnabled: true,
  remindersEnabled: true,
  reminderFrequency: "realtime" as const,
  notifyOnRoleChange: true,
  aiAgentCanPerformActions: false,
};

/** GET /api/admin/settings — current admin's settings (or defaults). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json(DEFAULTS);
    }
    const settings = await storage.getAdminSettings(userId);
    if (!settings) {
      return NextResponse.json(DEFAULTS);
    }
    return NextResponse.json({
      emailNotifications: settings.emailNotifications,
      inAppNotifications: settings.inAppNotifications,
      pushNotificationsEnabled: settings.pushNotificationsEnabled,
      remindersEnabled: settings.remindersEnabled,
      reminderFrequency: settings.reminderFrequency,
      notifyOnRoleChange: settings.notifyOnRoleChange,
      aiAgentCanPerformActions: settings.aiAgentCanPerformActions,
    });
  } catch (e) {
    console.error("GET admin settings error:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

/** PATCH /api/admin/settings — update current admin's settings. */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const allowed: (keyof typeof DEFAULTS)[] = [
      "emailNotifications",
      "inAppNotifications",
      "pushNotificationsEnabled",
      "remindersEnabled",
      "reminderFrequency",
      "notifyOnRoleChange",
      "aiAgentCanPerformActions",
    ];
    const updates: Record<string, boolean | string> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "reminderFrequency") {
          const v = body[key];
          if (["realtime", "hourly", "daily", "weekly"].includes(v)) updates[key] = v;
        } else {
          updates[key] = Boolean(body[key]);
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      const current = await storage.getAdminSettings(userId);
      return NextResponse.json(current ?? DEFAULTS);
    }
    const updated = await storage.upsertAdminSettings(userId, updates as Parameters<typeof storage.upsertAdminSettings>[1]);
    return NextResponse.json({
      emailNotifications: updated.emailNotifications,
      inAppNotifications: updated.inAppNotifications,
      pushNotificationsEnabled: updated.pushNotificationsEnabled,
      remindersEnabled: updated.remindersEnabled,
      reminderFrequency: updated.reminderFrequency,
      notifyOnRoleChange: updated.notifyOnRoleChange,
      aiAgentCanPerformActions: updated.aiAgentCanPerformActions,
    });
  } catch (e) {
    console.error("PATCH admin settings error:", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
