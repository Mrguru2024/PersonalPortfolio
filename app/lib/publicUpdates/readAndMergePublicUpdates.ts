import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { fetchCuratedFeedItems } from "./curatedFeeds";
import type { PublicUpdateEntryOut, PublicUpdatesTopic } from "./types";

const PUBLIC_UPDATES_PATH = join(process.cwd(), "content", "public-updates.json");

type StoredCategory =
  | "marketing_industry_update"
  | "persona_interest"
  | "new_project_intake"
  | "ascendra_public";

const ALLOWED_CATEGORIES = new Set<StoredCategory>([
  "marketing_industry_update",
  "persona_interest",
  "new_project_intake",
  "ascendra_public",
]);

const ALLOWED_TOPICS = new Set<PublicUpdatesTopic>([
  "marketing",
  "digital_marketing",
  "advertising",
  "ascendra_public",
]);

const LEGACY_CATEGORY_TO_TOPIC: Record<
  Exclude<StoredCategory, "ascendra_public">,
  PublicUpdatesTopic
> = {
  marketing_industry_update: "marketing",
  persona_interest: "ascendra_public",
  new_project_intake: "ascendra_public",
};

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

function ascendraId(date: string, title: string): string {
  const key = `${date}|${title}`.slice(0, 320);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return `ascendra:${Math.abs(h).toString(36)}`;
}

function resolveTopic(category: StoredCategory, topicRaw: unknown): PublicUpdatesTopic {
  if (typeof topicRaw === "string" && ALLOWED_TOPICS.has(topicRaw as PublicUpdatesTopic)) {
    return topicRaw as PublicUpdatesTopic;
  }
  if (category === "ascendra_public") return "ascendra_public";
  return LEGACY_CATEGORY_TO_TOPIC[category];
}

function readAscendraPublicUpdates(): PublicUpdateEntryOut[] {
  if (!existsSync(PUBLIC_UPDATES_PATH)) return [];
  const raw = readFileSync(PUBLIC_UPDATES_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  const entries: PublicUpdateEntryOut[] = [];

  for (const item of parsed) {
    if (!isObject(item)) continue;
    const date = typeof item.date === "string" ? parseDate(item.date.trim()) : null;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const description = typeof item.description === "string" ? item.description.trim() : "";
    const categoryRaw = typeof item.category === "string" ? item.category.trim() : "";
    const visibility = typeof item.visibility === "string" ? item.visibility.trim() : "";
    const factChecked = item.factChecked === true;
    const detailsRaw = typeof item.details === "string" ? item.details.trim() : "";
    const sourceUrlRaw = typeof item.sourceUrl === "string" ? item.sourceUrl.trim() : "";

    if (!date || !title || !description || !factChecked) continue;
    if (!ALLOWED_CATEGORIES.has(categoryRaw as StoredCategory)) continue;
    if (visibility !== "public") continue;
    if (isCommitStyleText(title) || isCommitStyleText(description)) continue;
    if (hasInternalOnlySignal(title) || hasInternalOnlySignal(description)) continue;
    if (detailsRaw && (isCommitStyleText(detailsRaw) || hasInternalOnlySignal(detailsRaw))) continue;

    const category = categoryRaw as StoredCategory;
    const topic = resolveTopic(category, item.topic);

    entries.push({
      id: ascendraId(date, title),
      date,
      title,
      description,
      details: detailsRaw || null,
      topic,
      category,
      visibility: "public",
      factChecked: true,
      sourceName: "Ascendra",
      sourceUrl: sourceUrlRaw || null,
      kind: "ascendra_editorial",
    });
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getMergedPublicUpdates(maxEntries: number): Promise<PublicUpdateEntryOut[]> {
  const ascendra = readAscendraPublicUpdates();
  const feeds = await fetchCuratedFeedItems();
  const byId = new Map<string, PublicUpdateEntryOut>();

  for (const row of ascendra) {
    byId.set(row.id, row);
  }
  for (const row of feeds) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }

  const merged = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  const cap = Math.max(1, Math.min(maxEntries, 120));
  return merged.slice(0, cap);
}
