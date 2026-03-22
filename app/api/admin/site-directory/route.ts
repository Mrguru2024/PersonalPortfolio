import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  SITE_DIRECTORY_ENTRIES_UNIQUE,
  entriesByCluster,
  type SiteDirectoryEntry,
} from "@/lib/siteDirectory";

export const dynamic = "force-dynamic";

function clustersPayload(): Record<string, SiteDirectoryEntry[]> {
  const m = entriesByCluster();
  return Object.fromEntries([...m.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * GET /api/admin/site-directory
 * Full route map for admins and AI agents (Cursor, etc.). Requires approved admin session.
 * Query: ?q=search+terms — filtered entries only.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    let entries = SITE_DIRECTORY_ENTRIES_UNIQUE;
    if (q) {
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      entries = entries.filter((e) => {
        const hay = [
          e.path,
          e.title,
          e.category,
          e.description,
          e.cluster ?? "",
          e.consolidateNote ?? "",
          ...(e.keywords ?? []),
          ...(e.relatedPaths ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: entries.length,
      query: q || null,
      entries,
      clusters: clustersPayload(),
    });
  } catch (e) {
    console.error("site-directory GET:", e);
    return NextResponse.json({ error: "Failed to load site directory" }, { status: 500 });
  }
}
