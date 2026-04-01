import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  createTrackedNumber,
  listTrackedNumbersForAdmin,
} from "@server/services/behavior/behaviorPhoneTrackingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const rows = await listTrackedNumbersForAdmin();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const phoneE164 = typeof body?.phoneE164 === "string" ? body.phoneE164 : "";
  if (!phoneE164.trim()) {
    return NextResponse.json({ error: "phoneE164 required" }, { status: 400 });
  }
  try {
    const row = await createTrackedNumber({
      phoneE164,
      label: typeof body?.label === "string" ? body.label : undefined,
      provider: typeof body?.provider === "string" ? body.provider : undefined,
      recordingEnabled: body?.recordingEnabled !== false,
      active: body?.active !== false,
      businessId: typeof body?.businessId === "string" ? body.businessId : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
