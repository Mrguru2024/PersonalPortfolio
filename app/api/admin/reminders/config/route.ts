import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { toAdminSettingsApiPayload } from "@/lib/adminSettingsResponse";

export const dynamic = "force-dynamic";

/** GET /api/admin/reminders/config — reminder planning/editorial targeting settings for current admin. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const settings = await storage.getAdminSettings(userId);
    const payload = toAdminSettingsApiPayload(settings);
    return NextResponse.json({
      reminderPlanningDays: payload.reminderPlanningDays,
      reminderCityFocus: payload.reminderCityFocus,
      reminderEditorialHolidaysEnabled: payload.reminderEditorialHolidaysEnabled,
      reminderEditorialLocalEventsEnabled: payload.reminderEditorialLocalEventsEnabled,
      reminderEditorialHorizonDays: payload.reminderEditorialHorizonDays,
    });
  } catch (e) {
    console.error("GET admin reminder config error:", e);
    return NextResponse.json({ error: "Failed to load reminder config" }, { status: 500 });
  }
}
