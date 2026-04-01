import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import {
  getSchedulingSettings,
  listHostBlockedDatesForUser,
  listHostWeeklyRulesForUser,
  replaceHostBlockedDatesForUser,
  replaceHostWeeklyRulesForUser,
} from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const uid = user?.id;
  if (typeof uid !== "number") {
    return NextResponse.json({ message: "Session required" }, { status: 403 });
  }
  const settings = await getSchedulingSettings();
  const weeklyRules = await listHostWeeklyRulesForUser(uid);
  const blockedDates = await listHostBlockedDatesForUser(uid);
  return NextResponse.json({
    timezone: settings.businessTimezone,
    weeklyRules: weeklyRules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startTimeLocal: r.startTimeLocal,
      endTimeLocal: r.endTimeLocal,
    })),
    blockedDates,
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const uid = user?.id;
  if (typeof uid !== "number") {
    return NextResponse.json({ message: "Session required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const weeklyRaw = body.weeklyRules;
  const blockedRaw = body.blockedDates;
  if (!Array.isArray(weeklyRaw) || !Array.isArray(blockedRaw)) {
    return NextResponse.json({ error: "weeklyRules and blockedDates must be arrays" }, { status: 400 });
  }
  const weeklyRules = weeklyRaw.map((r: Record<string, unknown>) => ({
    dayOfWeek: Number(r.dayOfWeek),
    startTimeLocal: String(r.startTimeLocal ?? ""),
    endTimeLocal: String(r.endTimeLocal ?? ""),
  }));
  const blockedDates = blockedRaw.map((d: unknown) => String(d ?? "").trim()).filter(Boolean);

  const wr = await replaceHostWeeklyRulesForUser(uid, weeklyRules);
  if (!wr.ok) {
    return NextResponse.json({ error: wr.error }, { status: 400 });
  }
  const br = await replaceHostBlockedDatesForUser(uid, blockedDates);
  if (!br.ok) {
    return NextResponse.json({ error: br.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, weeklyInserted: wr.inserted, blockedInserted: br.inserted });
}
