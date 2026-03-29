/**
 * Builds periodic, server-side context for the admin AI agent: site directory (from source),
 * AGENTS.md, package scripts, and a filesystem scan of app/api/admin route handlers.
 * Cached in memory with TTL to limit disk reads.
 */

import { readdir, readFile } from "fs/promises";
import path from "path";
import { SITE_DIRECTORY_ENTRIES_UNIQUE } from "@/lib/siteDirectory";
import { getAdminAgentFeatureGuideText } from "@server/services/adminAgentFeatureGuide";

const TTL_MS = 5 * 60 * 1000; // 5 minutes — “periodic” refresh

type CacheEntry = { at: number; text: string; apiRouteCount: number; siteEntryCount: number };

let cache: CacheEntry | null = null;

const MAX_AGENTS_MD = 10_000;
const MAX_API_LINES = 250;
const MAX_SITE_LINES = 350;

async function walkAdminApiRoutes(absDir: string, apiRoot: string): Promise<string[]> {
  const urls: string[] = [];
  let entries;
  try {
    entries = await readdir(absDir, { withFileTypes: true });
  } catch {
    return urls;
  }
  for (const ent of entries) {
    const full = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      urls.push(...(await walkAdminApiRoutes(full, apiRoot)));
    } else if (ent.name === "route.ts" || ent.name === "route.js" || ent.name === "route.tsx") {
      const folder = absDir;
      const rel = path.relative(apiRoot, folder);
      const norm = rel.split(path.sep).join("/");
      const suffix = norm && norm !== "." ? `/${norm}` : "";
      urls.push(`/api/admin${suffix}`);
    }
  }
  return urls;
}

async function readPackageScriptsSnippet(repoRoot: string): Promise<string> {
  try {
    const raw = await readFile(path.join(repoRoot, "package.json"), "utf8");
    const j = JSON.parse(raw) as { scripts?: Record<string, string> };
    const scripts = j.scripts ?? {};
    const keys = Object.keys(scripts).sort();
    return keys.slice(0, 80).map((k) => `${k}: ${scripts[k]}`).join("\n");
  } catch {
    return "";
  }
}

/**
 * Full text block appended to the model system prompt (or used in fallback help).
 */
export async function buildAdminAgentContextText(): Promise<{
  text: string;
  apiRouteCount: number;
  siteEntryCount: number;
}> {
  const repoRoot = process.cwd();

  const siteLines = SITE_DIRECTORY_ENTRIES_UNIQUE.slice(0, MAX_SITE_LINES).map(
    (e) => `${e.path}\t${e.title}\t${e.audience}\t${e.category}`,
  );
  const siteEntryCount = SITE_DIRECTORY_ENTRIES_UNIQUE.length;

  let agentsMd = "";
  try {
    const ag = await readFile(path.join(repoRoot, "AGENTS.md"), "utf8");
    agentsMd = ag.slice(0, MAX_AGENTS_MD);
  } catch {
    agentsMd = "(AGENTS.md not found or unreadable)";
  }

  const apiRoot = path.join(repoRoot, "app", "api", "admin");
  const apiUrls = [...new Set(await walkAdminApiRoutes(apiRoot, apiRoot))].sort();
  const apiSlice = apiUrls.slice(0, MAX_API_LINES);
  const apiRouteCount = apiUrls.length;

  const scripts = await readPackageScriptsSnippet(repoRoot);

  const featureGuide = getAdminAgentFeatureGuideText();

  const parts: string[] = [
    "You are assisting an approved admin of the Ascendra portfolio app (Next.js, Drizzle, PostgreSQL).",
    "The data below is loaded from the deployed codebase on the server and refreshed every few minutes.",
    "When the admin asks how to use a feature, prefer the FEATURE GUIDE section below plus site directory paths.",
    "",
    "### npm scripts (subset)",
    scripts || "(none)",
    "",
    `### Site & admin routes (${siteEntryCount} entries; showing ${siteLines.length}) — tab-separated: path, title, audience, category`,
    siteLines.join("\n"),
    "",
    featureGuide,
    "",
    `### Admin API base paths (${apiRouteCount} from filesystem; showing ${apiSlice.length})`,
    apiSlice.join("\n"),
    "",
    "### AGENTS.md (local dev / ops)",
    agentsMd,
  ];

  return {
    text: parts.join("\n"),
    apiRouteCount,
    siteEntryCount,
  };
}

export async function getCachedAdminAgentContext(): Promise<CacheEntry> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return cache;
  }
  const { text, apiRouteCount, siteEntryCount } = await buildAdminAgentContextText();
  cache = { at: now, text, apiRouteCount, siteEntryCount };
  return cache;
}

export function invalidateAdminAgentContextCache(): void {
  cache = null;
}
