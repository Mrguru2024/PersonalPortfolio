import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicUpdateCategory = "client_project" | "ascendra_innovation" | "site_update" | "market_update";

interface PublicUpdateEntry {
  date: string;
  title: string;
  description: string;
  category: PublicUpdateCategory;
  factChecked: boolean;
}

const PUBLIC_UPDATES_PATH = join(process.cwd(), "content", "public-updates.json");

const ALLOWED_CATEGORIES = new Set<PublicUpdateCategory>([
  "client_project",
  "ascendra_innovation",
  "site_update",
  "market_update",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
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
    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error("Changelog API error:", error);
    return NextResponse.json(
      { error: "Failed to load updates", entries: [] },
      { status: 200 }
    );
  }
}
