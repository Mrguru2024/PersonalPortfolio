import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  listInsightRunsForDocument,
  listSuggestionsForDocument,
} from "@server/services/growthIntelligence/contentInsightService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { docId } = await params;
    const id = parseInt(docId, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const runs = await listInsightRunsForDocument(id);
    const suggestions = await listSuggestionsForDocument(id);
    return NextResponse.json({ runs, suggestions });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
