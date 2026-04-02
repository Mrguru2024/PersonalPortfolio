import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { isAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InternalUpdateCategory = "project_update" | "agency_market_data";
type InternalUpdateAudience = "admin_only";

interface InternalUpdateEntry {
  date: string;
  title: string;
  description: string;
  category: InternalUpdateCategory;
  audience: InternalUpdateAudience;
}

const INTERNAL_UPDATES_PATH = join(process.cwd(), "content", "internal-updates.json");

const ALLOWED_CATEGORIES = new Set<InternalUpdateCategory>(["project_update", "agency_market_data"]);
const ALLOWED_AUDIENCES = new Set<InternalUpdateAudience>(["admin_only"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function readInternalUpdates(limit: number): InternalUpdateEntry[] {
  if (!existsSync(INTERNAL_UPDATES_PATH)) return [];
  const raw = readFileSync(INTERNAL_UPDATES_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  const entries: InternalUpdateEntry[] = [];
  for (const item of parsed) {
    if (!isObject(item)) continue;
    const date = typeof item.date === "string" ? parseDate(item.date.trim()) : null;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const description = typeof item.description === "string" ? item.description.trim() : "";
    const category = typeof item.category === "string" ? item.category.trim() : "";
    const audience = typeof item.audience === "string" ? item.audience.trim() : "";
    if (!date || !title || !description) continue;
    if (!ALLOWED_CATEGORIES.has(category as InternalUpdateCategory)) continue;
    if (!ALLOWED_AUDIENCES.has(audience as InternalUpdateAudience)) continue;
    entries.push({
      date,
      title,
      description,
      category: category as InternalUpdateCategory,
      audience: audience as InternalUpdateAudience,
    });
  }

  return entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, Math.max(1, Math.min(limit, 100)));
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const entries = readInternalUpdates(50);
    const response = NextResponse.json({ entries });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Admin updates API error:", error);
    const response = NextResponse.json(
      { error: "Failed to load internal updates", entries: [] },
      { status: 200 },
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}
