import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_KEYWORD_MATCH_TYPES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okMatch(s: unknown): s is (typeof PPC_KEYWORD_MATCH_TYPES)[number] {
  return typeof s === "string" && (PPC_KEYWORD_MATCH_TYPES as readonly string[]).includes(s);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const updates: Parameters<typeof storage.updatePpcKeyword>[1] = {};
    if (typeof body.keywordText === "string") updates.keywordText = body.keywordText.trim();
    if (okMatch(body.matchType)) updates.matchType = body.matchType;
    if (typeof body.isNegative === "boolean") updates.isNegative = body.isNegative;
    if (typeof body.platformKeywordId === "string") updates.platformKeywordId = body.platformKeywordId;
    if (typeof body.notes === "string") updates.notes = body.notes;
    const updated = await storage.updatePpcKeyword(id, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    await storage.deletePpcKeyword(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
