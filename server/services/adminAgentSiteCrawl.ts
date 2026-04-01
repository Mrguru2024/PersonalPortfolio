/**
 * Static “crawl” of the repo for the admin AI assistant: rich site-directory lines
 * plus lightweight extraction of `metadata` titles/descriptions from App Router files.
 * No HTTP fetch — safe on serverless and reflects the deployed codebase.
 */

import { readdir, readFile } from "fs/promises";
import path from "path";
import type { SiteDirectoryEntry } from "@/lib/siteDirectory";

const MAX_RICH_SITE_LINES = 450;
const MAX_PAGE_FILES_SCANNED = 220;
const MAX_FILE_BYTES = 14_000;

/** One line per route, easy for the model to scan. */
export function formatSiteDirectoryRichDigest(entries: readonly SiteDirectoryEntry[]): string {
  const lines: string[] = [];
  for (const e of entries.slice(0, MAX_RICH_SITE_LINES)) {
    const rel = e.relatedPaths?.length ? ` related:${e.relatedPaths.slice(0, 6).join(",")}` : "";
    const cluster = e.cluster ? ` cluster:${e.cluster}` : "";
    const kw = e.keywords.length ? ` keywords:${e.keywords.slice(0, 12).join(";")}` : "";
    lines.push(
      `${e.path} | ${e.title} | ${e.audience} | ${e.category} | ${e.description.replace(/\s+/g, " ").trim()}${kw}${rel}${cluster}`,
    );
  }
  return lines.join("\n");
}

function guessRouteFromAdminPageFile(adminRoot: string, fileDir: string): string {
  const rel = path.relative(adminRoot, fileDir).split(path.sep).join("/");
  if (!rel || rel === ".") return "/admin";
  return `/admin/${rel}`;
}

/** Pull quoted title/description from typical `export const metadata` objects. */
function extractMetadataHints(source: string): { title?: string; description?: string } {
  const titleM = source.match(/title:\s*["']([^"']+)["']/);
  const descM = source.match(/description:\s*["']([^"']{1,280})["']/);
  return {
    title: titleM?.[1]?.trim(),
    description: descM?.[1]?.trim().replace(/\s+/g, " "),
  };
}

/** Walk `app/admin` recursively for `page.tsx` / `page.jsx` and record metadata hints when found. */
export async function crawlAdminAppRouterMetadata(repoRoot: string): Promise<string[]> {
  const adminRoot = path.join(repoRoot, "app", "admin");
  const out: string[] = [];
  let scanned = 0;

  async function walk(dir: string): Promise<void> {
    if (scanned >= MAX_PAGE_FILES_SCANNED) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (scanned >= MAX_PAGE_FILES_SCANNED) return;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.name === "page.tsx" || ent.name === "page.jsx") {
        scanned++;
        const routePath = guessRouteFromAdminPageFile(adminRoot, path.dirname(full));
        let raw = "";
        try {
          raw = await readFile(full, "utf8");
        } catch {
          out.push(`${routePath}\t(unreadable)`);
          continue;
        }
        const slice = raw.length > MAX_FILE_BYTES ? raw.slice(0, MAX_FILE_BYTES) : raw;
        const { title, description } = extractMetadataHints(slice);
        const parts = [
          title && `title:"${title}"`,
          description && `desc:"${description.slice(0, 140)}${description.length > 140 ? "..." : ""}"`,
        ].filter(Boolean);
        out.push(parts.length > 0 ? `${routePath}\t${parts.join(" ")}` : `${routePath}\t(no static metadata strings in first bytes)`);
      }
    }
  }

  try {
    await walk(adminRoot);
  } catch {
    return [];
  }
  return out.sort();
}
