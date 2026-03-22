import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { aiParseAvailabilityDescription } from "@server/services/schedulingAiService";
import { replaceAvailabilityRulesForScope } from "@server/services/schedulingService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST body: { description: string, bookingTypeId?: null | number }
 * Parses natural language with AI, then replaces all availability rules for that scope (global if null).
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const description = String(body.description ?? "").trim();
  if (!description) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }
  let bookingTypeId: number | null = null;
  if (body.bookingTypeId !== undefined && body.bookingTypeId !== null && body.bookingTypeId !== "null") {
    const n = typeof body.bookingTypeId === "number" ? body.bookingTypeId : parseInt(String(body.bookingTypeId), 10);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "bookingTypeId must be null or a number" }, { status: 400 });
    }
    bookingTypeId = n;
  }
  const parsed = await aiParseAvailabilityDescription(description);
  const applied = await replaceAvailabilityRulesForScope(bookingTypeId, parsed.rules);
  if (!applied.ok) {
    return NextResponse.json({ summary: parsed.summary, rules: parsed.rules, error: applied.error }, { status: 400 });
  }
  return NextResponse.json({
    summary: parsed.summary,
    rules: parsed.rules,
    inserted: applied.inserted,
    bookingTypeId,
  });
}
