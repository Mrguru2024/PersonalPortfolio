import { NextResponse } from "next/server";
import {
  listActiveBookingTypes,
  getSchedulingSettings,
  listSchedulingHostUsers,
} from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getSchedulingSettings();
    if (!settings.publicBookingEnabled) {
      return NextResponse.json({ enabled: false, types: [] });
    }
    const types = await listActiveBookingTypes();
    const hosts = await listSchedulingHostUsers();
    return NextResponse.json({
      enabled: true,
      timezone: settings.businessTimezone,
      aiAssistantEnabled: settings.aiAssistantEnabled,
      hosts: hosts.map((h) => ({
        id: h.id,
        username: h.username,
        displayName: (h.full_name?.trim() || h.username) as string,
      })),
      types: types.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        durationMinutes: t.durationMinutes,
        description: t.description,
      })),
    });
  } catch (e) {
    console.error("[public/scheduling/types]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
