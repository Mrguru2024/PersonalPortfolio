import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicUpdateCategory =
  | "marketing_industry_update"
  | "persona_interest"
  | "new_project_intake";

interface PublicUpdateEntry {
  date: string;
  title: string;
  description: string;
  category: PublicUpdateCategory;
  factChecked: boolean;
}

const PUBLIC_UPDATES_PATH = join(process.cwd(), "content", "public-updates.json");

const ALLOWED_CATEGORIES = new Set<PublicUpdateCategory>([
  "marketing_industry_update",
  "persona_interest",
  "new_project_intake",
]);

const COMMIT_STYLE_PATTERNS: RegExp[] = [
  /^(?:feat|fix|chore|docs?|refactor|style|test|build|ci|perf)(?:\([^)]+\))?:/i,
  /\bmerge\s+(?:branch|pull request)\b/i,
  /\bdev(?:elopment)?\s*log\b/i,
  /\bdevelopment-updates\b/i,
  /\bauto\s*[·-]\s*[0-9a-f]{7,40}\b/i,
  /`[0-9a-f]{7,40}`/,
  /\b(?:[0-9a-f]*\d[0-9a-f]*){7,40}\b/i,
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function isCommitStyleText(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return COMMIT_STYLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function readPublicUpdates(limit: number): PublicUpdateEntry[] {
  if (!existsSync(PUBLIC_UPDATES_PATH)) return [];
  const raw = readFileSync(PUBLIC_UPDATES_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  const entries: PublicUpdateEntry[] = [];

  for (const item of parsed) {
    if (!isObject(item)) continue;
    const date = typeof item.date === "string" ? parseDate(item.date.trim()) : null;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const description = typeof item.description === "string" ? item.description.trim() : "";
    const category = typeof item.category === "string" ? item.category.trim() : "";
    const factChecked = item.factChecked === true;
    if (!date || !title || !description || !factChecked) continue;
    if (!ALLOWED_CATEGORIES.has(category as PublicUpdateCategory)) continue;
    if (isCommitStyleText(title) || isCommitStyleText(description)) continue;
    entries.push({
      date,
      title,
      description,
      category: category as PublicUpdateCategory,
      factChecked,
    });
  }

  return entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, Math.max(1, Math.min(limit, 50)));
}

/** GET /api/changelog - Public-facing, relevant, fact-checked updates only. */
export async function GET() {
  try {
    const entries = readPublicUpdates(25);
    const response = NextResponse.json({ entries });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error: any) {
    console.error("Changelog API error:", error);
    const response = NextResponse.json(
      { error: "Failed to load updates", entries: [] },
      { status: 200 }
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}
