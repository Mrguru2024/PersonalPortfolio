import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { seedUrgencyConversionStarters } from "@server/seedUrgencyConversion";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    await seedUrgencyConversionStarters();
    return NextResponse.json({ ok: true, message: "Default surfaces inserted where missing." });
  } catch (e) {
    console.error("[POST admin/urgency-conversion/seed]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
