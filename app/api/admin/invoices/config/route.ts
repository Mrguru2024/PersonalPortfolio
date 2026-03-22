import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Defaults for the admin invoice form (tax % from server env). */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const raw = process.env.INVOICE_DEFAULT_TAX_PERCENT ?? "0";
  const defaultTaxPercent = Math.min(100, Math.max(0, parseFloat(raw) || 0));
  return NextResponse.json({ defaultTaxPercent });
}
