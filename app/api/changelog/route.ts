import { NextResponse } from "next/server";
import { githubService } from "@server/services/githubService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** GET /api/changelog - Recent project updates in simple, client-friendly language (from GitHub commits). */
export async function GET() {
  try {
    const entries = await githubService.getChangelogEntries(25);
    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error("Changelog API error:", error);
    return NextResponse.json(
      { error: "Failed to load updates", entries: [] },
      { status: 200 }
    );
  }
}
