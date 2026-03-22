import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { createAvailabilityRuleAdmin, listAvailabilityRulesAdmin } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  let rules;
  if (scope === "global") {
    rules = await listAvailabilityRulesAdmin({ bookingTypeId: "null_only" });
  } else if (scope && /^\d+$/.test(scope)) {
    rules = await listAvailabilityRulesAdmin({ bookingTypeId: parseInt(scope, 10) });
  } else {
    rules = await listAvailabilityRulesAdmin();
  }
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const bookingTypeId =
    body.bookingTypeId === null || body.bookingTypeId === "null"
      ? null
      : typeof body.bookingTypeId === "number"
        ? body.bookingTypeId
        : parseInt(String(body.bookingTypeId), 10);
  if (bookingTypeId !== null && !Number.isFinite(bookingTypeId)) {
    return NextResponse.json({ error: "bookingTypeId must be null or a number" }, { status: 400 });
  }
  const result = await createAvailabilityRuleAdmin({
    bookingTypeId,
    dayOfWeek: Number(body.dayOfWeek),
    startTimeLocal: String(body.startTimeLocal ?? ""),
    endTimeLocal: String(body.endTimeLocal ?? ""),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ id: result.id });
}
