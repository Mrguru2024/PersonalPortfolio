import { NextResponse } from "next/server";
import { getMergedPublicUpdates } from "@/lib/publicUpdates/readAndMergePublicUpdates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET /api/changelog — Ascendra public editorials + curated marketing/ad feeds (publisher links). */
export async function GET() {
  try {
    const entries = await getMergedPublicUpdates(110);
    const response = NextResponse.json({
      entries,
      refreshedAt: new Date().toISOString(),
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error: unknown) {
    console.error("Changelog API error:", error);
    const response = NextResponse.json(
      { error: "Failed to load updates", entries: [], refreshedAt: new Date().toISOString() },
      { status: 200 },
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}
