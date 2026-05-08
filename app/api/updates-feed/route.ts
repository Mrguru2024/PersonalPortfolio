import { NextResponse } from "next/server";
import { getUpdatesFeed } from "@server/services/updatesFeedService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET /api/updates-feed — aggregated RSS + Ascendra blog + verified public notes (short server + CDN cache). */
export async function GET() {
  try {
    const payload = await getUpdatesFeed();
    const res = NextResponse.json(payload);
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res;
  } catch (error) {
    console.error("updates-feed API error:", error);
    const res = NextResponse.json(
      { items: [], generatedAt: new Date().toISOString(), cacheTtlMs: 45_000, error: "Failed to load feed" },
      { status: 200 },
    );
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  }
}
