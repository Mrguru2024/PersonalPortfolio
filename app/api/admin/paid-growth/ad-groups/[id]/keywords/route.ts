import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { PPC_KEYWORD_MATCH_TYPES } from "@shared/paidGrowthSchema";

export const dynamic = "force-dynamic";

function okMatch(s: unknown): s is (typeof PPC_KEYWORD_MATCH_TYPES)[number] {
  return typeof s === "string" && (PPC_KEYWORD_MATCH_TYPES as readonly string[]).includes(s);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const adGroupId = Number((await params).id);
    const keywords = await storage.listPpcKeywordsByAdGroup(adGroupId);
    return NextResponse.json({ keywords });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load keywords" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const adGroupId = Number((await params).id);
    const body = await req.json().catch(() => ({}));
    const keywordText = typeof body.keywordText === "string" ? body.keywordText.trim() : "";
    if (!keywordText) return NextResponse.json({ error: "keywordText required" }, { status: 400 });
    const matchType = okMatch(body.matchType) ? body.matchType : "phrase";
    const row = await storage.createPpcKeyword({
      adGroupId,
      keywordText,
      matchType,
      isNegative: Boolean(body.isNegative),
      platformKeywordId: typeof body.platformKeywordId === "string" ? body.platformKeywordId : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
