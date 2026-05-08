import { existsSync, readFileSync } from "fs";
import { join } from "path";

export type PublicUpdateCategory =
  | "marketing_industry_update"
  | "persona_interest"
  | "new_project_intake";

export interface PublicUpdateEntry {
  date: string;
  title: string;
  description: string;
  category: PublicUpdateCategory;
  visibility: "public";
  factChecked: boolean;
}

const PUBLIC_UPDATES_PATH = join(process.cwd(), "content", "public-updates.json");

const ALLOWED_CATEGORIES = new Set<PublicUpdateCategory>([
  "marketing_industry_update",
  "persona_interest",
  "new_project_intake",
]);
const ALLOWED_VISIBILITY = new Set<PublicUpdateEntry["visibility"]>(["public"]);

const COMMIT_STYLE_PATTERNS: RegExp[] = [
  /^(?:feat|fix|chore|docs?|refactor|style|test|build|ci|perf)(?:\([^)]+\))?:/i,
  /\bmerge\s+(?:branch|pull request)\b/i,
  /\bdev(?:elopment)?\s*log\b/i,
  /\bdevelopment-updates\b/i,
  /\bauto\s*[·-]\s*[0-9a-f]{7,40}\b/i,
  /`[0-9a-f]{7,40}`/,
  /\b(?:[0-9a-f]*\d[0-9a-f]*){7,40}\b/i,
];

const INTERNAL_ONLY_PATTERNS: RegExp[] = [
  /\bdevelopment\s+updates?\b/i,
  /\binternal\s+updates?\b/i,
  /\badmin(?:-only)?\b/i,
  /\bascendra\s+innovation\b/i,
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

function hasInternalOnlySignal(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return INTERNAL_ONLY_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Fact-checked public entries from `content/public-updates.json` (newest first). */
export function readPublicUpdates(limit: number): PublicUpdateEntry[] {
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
    const visibility = typeof item.visibility === "string" ? item.visibility.trim() : "";
    const factChecked = item.factChecked === true;
    if (!date || !title || !description || !factChecked) continue;
    if (!ALLOWED_CATEGORIES.has(category as PublicUpdateCategory)) continue;
    if (!ALLOWED_VISIBILITY.has(visibility as PublicUpdateEntry["visibility"])) continue;
    if (isCommitStyleText(title) || isCommitStyleText(description)) continue;
    if (hasInternalOnlySignal(title) || hasInternalOnlySignal(description)) continue;
    entries.push({
      date,
      title,
      description,
      category: category as PublicUpdateCategory,
      visibility: visibility as PublicUpdateEntry["visibility"],
      factChecked,
    });
  }

  return entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, Math.max(1, Math.min(limit, 50)));
}
