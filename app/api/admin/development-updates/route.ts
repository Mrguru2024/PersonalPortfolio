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
  /** Optional time (e.g. "14:30" or "2:30 PM"). Omitted when not in source. */
  time?: string;
  title: string;
  items: string[];
}

/** Strip markdown bold and extra asterisks for digestible plain text. */
function toPlainText(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

/** Normalize time string to HH:mm for display (e.g. "14:30" or "2:30 PM" -> keep as-is for display). */
function normalizeTime(t: string): string {
  const trimmed = t.trim();
  if (!trimmed) return "";
  return trimmed;
}

/** Parse markdown-style log into entries. Format: ## YYYY-MM-DD [HH:MM] [—] Title. Optional time after date (space or T). */
function parseUpdatesMarkdown(raw: string): DevelopmentUpdateEntry[] {
  const entries: DevelopmentUpdateEntry[] = [];
  const blocks = raw.split(/\n##\s+/).filter(Boolean);
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0] ?? "";
    // Match: date only "2025-03-15 — Title", or with time "2025-03-15 14:30 — Title" or "2025-03-15T14:30 — Title" or "2025-03-15 2:30 PM — Title"
    const dateOnlyMatch = firstLine.match(/^(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+)$/);
    const dateTimeMatch = firstLine.match(/^(\d{4}-\d{2}-\d{2})(?:[\sT](\d{1,2}:\d{2}(?:\s*[AP]M)?|\d{2}:\d{2}))?\s*[—–-]\s*(.+)$/);
    const match = dateTimeMatch || dateOnlyMatch;
    if (!match) continue;
    const date = match[1] ?? "";
    const timeRaw = match[2]?.trim();
    const title = (dateTimeMatch ? match[3] : match[2]) ?? "";
    const time = timeRaw ? normalizeTime(timeRaw) : undefined;
    const rest = block.slice(firstLine.length).trim();
    const items = rest
      .split(/\n/)
      .map((line) => toPlainText(line.replace(/^\s*[-*]\s+/, "")))
      .filter(Boolean);
    entries.push({
      date,
      ...(time ? { time } : {}),
      title: toPlainText(title.trim()),
      items,
    });
  }
  return entries;
}

async function fetchRawFromGitHub(): Promise<string | null> {
  try {
    // Cache-bust so we don't get stale content from intermediaries (GitHub's own CDN may still cache ~5 min)
    const url = GITHUB_RAW_URL + (GITHUB_RAW_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
    const res = await fetch(url, {
      headers: {
        Accept: "text/plain",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
      next: { revalidate: 0 },
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
    let sourceNote: string | undefined;

    if (isProduction) {
      raw = await fetchRawFromGitHub();
      if (raw) {
        source = "github";
      } else {
        sourceNote = "GitHub fetch failed or repo is private; showing deployed file. Push may take ~5 min to appear on GitHub's CDN.";
      }
    }

    if (!raw && existsSync(CONTENT_PATH)) {
      raw = readFileSync(CONTENT_PATH, "utf-8");
    }

    if (!raw || !raw.trim()) {
      const res = NextResponse.json({ updates: [], source: "file", sourceNote: sourceNote ?? undefined });
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }

    const updates = parseUpdatesMarkdown(raw);
    const res = NextResponse.json({ updates, source, sourceNote });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (error) {
    console.error("Development updates read error:", error);
    return NextResponse.json({ updates: [], error: "Failed to load updates" }, { status: 500 });
  }
}
