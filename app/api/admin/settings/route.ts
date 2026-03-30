import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { ADMIN_SETTINGS_DEFAULTS, toAdminSettingsApiPayload } from "@/lib/adminSettingsResponse";
import { sanitizeAdminTtsConfigPatch } from "@shared/readAloudTtsConfig";

export const dynamic = "force-dynamic";

const DEFAULTS = ADMIN_SETTINGS_DEFAULTS;

/** GET /api/admin/settings — current admin's settings (or defaults). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json(toAdminSettingsApiPayload(undefined));
    }
    const settings = await storage.getAdminSettings(userId);
    return NextResponse.json(toAdminSettingsApiPayload(settings));
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
      "aiAgentRequireActionConfirmation",
      "aiMentorObserveUsage",
      "aiMentorProactiveCheckpoints",
    ];
    const notificationUpdates: Partial<typeof DEFAULTS> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "reminderFrequency") {
          const v = body[key];
          if (["realtime", "hourly", "daily", "weekly"].includes(v)) {
            (notificationUpdates as Record<string, string>)[key] = v;
          }
        } else {
          (notificationUpdates as Record<string, boolean>)[key] = Boolean(body[key]);
        }
      }
    }

    let mergedLayouts: Record<string, { order: string[]; hidden: string[] }> | undefined;
    if (body.adminUiLayouts !== undefined) {
      const raw = body.adminUiLayouts;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const existing = await storage.getAdminSettings(userId);
        mergedLayouts = { ...(existing?.adminUiLayouts ?? {}) };
        for (const [k, v] of Object.entries(raw)) {
          if (typeof k !== "string" || k.length > 64) continue;
          if (v === null) {
            delete mergedLayouts[k];
            continue;
          }
          if (!v || typeof v !== "object" || Array.isArray(v)) continue;
          const order = Array.isArray((v as { order?: unknown }).order)
            ? (v as { order: unknown[] }).order.filter((x): x is string => typeof x === "string")
            : [];
          const hidden = Array.isArray((v as { hidden?: unknown }).hidden)
            ? (v as { hidden: unknown[] }).hidden.filter((x): x is string => typeof x === "string")
            : [];
          mergedLayouts[k] = { order, hidden };
        }
      }
    }

    let ttsPatch: ReturnType<typeof sanitizeAdminTtsConfigPatch> = undefined;
    if (body.ttsConfig !== undefined) {
      ttsPatch = sanitizeAdminTtsConfigPatch(body.ttsConfig);
      if (ttsPatch === undefined) {
        return NextResponse.json({ error: "Invalid ttsConfig" }, { status: 400 });
      }
    }

    if (
      Object.keys(notificationUpdates).length === 0 &&
      mergedLayouts === undefined &&
      ttsPatch === undefined
    ) {
      const current = await storage.getAdminSettings(userId);
      return NextResponse.json(toAdminSettingsApiPayload(current));
    }

    const updated = await storage.upsertAdminSettings(userId, {
      ...(notificationUpdates as Record<string, unknown>),
      ...(mergedLayouts !== undefined ? { adminUiLayouts: mergedLayouts } : {}),
      ...(ttsPatch !== undefined ? { ttsConfig: ttsPatch } : {}),
    } as Parameters<typeof storage.upsertAdminSettings>[1]);

    return NextResponse.json(toAdminSettingsApiPayload(updated));
  } catch (e) {
    console.error("PATCH admin settings error:", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
