import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONTENT_PATH = join(process.cwd(), "content", "development-updates.md");

/** Optional: fetch latest from GitHub raw so pushes show up without redeploy. Set in production to e.g. https://raw.githubusercontent.com/OWNER/REPO/main/content/development-updates.md */
const GITHUB_RAW_URL =
  process.env.DEVELOPMENT_UPDATES_RAW_URL ||
  "https://raw.githubusercontent.com/Mrguru2024/PersonalPortfolio/main/content/development-updates.md";

export interface DevelopmentUpdateEntry {
  date: string;
  title: string;
  items: string[];
}

/** Strip markdown bold and extra asterisks for digestible plain text. */
function toPlainText(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

/** Parse markdown-style log into entries. Format: ## YYYY-MM-DD — Title, then - item lines. Output is plain text (no **). */
function parseUpdatesMarkdown(raw: string): DevelopmentUpdateEntry[] {
  const entries: DevelopmentUpdateEntry[] = [];
  const blocks = raw.split(/\n##\s+/).filter(Boolean);
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0] ?? "";
    const match = firstLine.match(/^(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+)$/);
    if (!match) continue;
    const [, date, title] = match;
    const rest = block.slice(firstLine.length).trim();
    const items = rest
      .split(/\n/)
      .map((line) => toPlainText(line.replace(/^\s*[-*]\s+/, "")))
      .filter(Boolean);
    entries.push({
      date: date ?? "",
      title: toPlainText((title ?? "").trim()),
      items,
    });
  }
  return entries;
}

async function fetchRawFromGitHub(): Promise<string | null> {
  try {
    const res = await fetch(GITHUB_RAW_URL, {
      headers: { Accept: "text/plain" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/development-updates
 * Returns parsed development log for the admin dashboard.
 * In production we fetch from GitHub raw first so pushes show up without redeploy; fallback to bundled file.
 * Locally we read from the file; refresh button and refetchInterval still apply.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    let raw: string | null = null;
    let source: "file" | "github" = "file";

    if (isProduction) {
      raw = await fetchRawFromGitHub();
      if (raw) source = "github";
    }

    if (!raw && existsSync(CONTENT_PATH)) {
      raw = readFileSync(CONTENT_PATH, "utf-8");
    }

    if (!raw || !raw.trim()) {
      const res = NextResponse.json({ updates: [], source: "file" });
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }

    const updates = parseUpdatesMarkdown(raw);
    const res = NextResponse.json({ updates, source });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (error) {
    console.error("Development updates read error:", error);
    return NextResponse.json({ updates: [], error: "Failed to load updates" }, { status: 500 });
  }
}
