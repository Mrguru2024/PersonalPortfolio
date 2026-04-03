import type { MetadataRoute } from "next";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@server/db";
import { blogPosts } from "@shared/schema";
import { WEBSITE_BREAKDOWNS } from "@/lib/authorityContent";
import { SITE_DIRECTORY_ENTRIES_UNIQUE } from "@/lib/siteDirectory";
import { ensureAbsoluteUrl, getSiteOriginForMetadata } from "@/lib/siteUrl";

export const revalidate = 3600;

const base = ensureAbsoluteUrl(getSiteOriginForMetadata());

/** Paths we do not want in the index (match layout robots / auth surfaces). */
const EXCLUDE_PREFIXES = [
  "/login",
  "/portal",
  "/auth",
  "/dashboard",
  "/gos",
  "/proposal",
  "/book/manage",
  "/api",
  "/admin",
  "/Afn/inbox",
  "/Afn/profile",
  "/Afn/settings",
  "/challenge/checkout",
  "/challenge/dashboard",
];

/** Thank-you / post-conversion URLs (robots noindex or redirect-only) — omit from sitemap. */
const EXCLUDE_EXACT_PATHS = new Set<string>([
  "/thank-you",
  "/call-confirmation",
  "/challenge/thank-you",
]);
const APP_DIR = path.join(process.cwd(), "app");
const PAGE_FILE_PATTERN = /^page\.(tsx|ts|jsx|js|mdx)$/i;

function absolutePath(path: string): string {
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${p}`;
}

function isValidHttpUrlForSitemap(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isExcludedPath(path: string): boolean {
  if (EXCLUDE_EXACT_PATHS.has(path)) return true;
  return EXCLUDE_PREFIXES.some((pre) => path === pre || path.startsWith(`${pre}/`));
}

function hasDynamicSegment(parts: string[]): boolean {
  return parts.some((part) => part.includes("[") || part.includes("]"));
}

async function discoverStaticPageRoutes(
  directory: string,
  routeSegments: string[] = [],
): Promise<Set<string>> {
  const routes = new Set<string>();
  const entries = await readdir(directory, {
    withFileTypes: true,
    encoding: "utf8",
  }).catch(() => null);
  if (!entries) {
    return routes;
  }

  const hasPageFile = entries.some((entry) => entry.isFile() && PAGE_FILE_PATTERN.test(entry.name));
  if (hasPageFile && !hasDynamicSegment(routeSegments)) {
    const routePath = routeSegments.length ? `/${routeSegments.join("/")}` : "/";
    if (!isExcludedPath(routePath)) routes.add(routePath);
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const segment = entry.name;
    if (segment === "api" || segment.startsWith("_") || segment.startsWith("@")) continue;

    const isRouteGroup = segment.startsWith("(") && segment.endsWith(")");
    const nextSegments = isRouteGroup ? routeSegments : [...routeSegments, segment];
    const nestedRoutes = await discoverStaticPageRoutes(path.join(directory, segment), nextSegments);
    for (const route of nestedRoutes) routes.add(route);
  }

  return routes;
}

function changeFrequency(path: string): MetadataRoute.Sitemap[0]["changeFrequency"] {
  if (path === "/") return "daily";
  if (path.startsWith("/blog")) return "weekly";
  if (path.startsWith("/Afn")) return "daily";
  if (path.includes("tools") || path.startsWith("/free-") || path.startsWith("/diagn")) {
    return "monthly";
  }
  if (path === "/privacy" || path === "/terms" || path === "/data-deletion-request") {
    return "yearly";
  }
  return "weekly";
}

function priority(path: string): number {
  if (path === "/") return 1;
  if (
    /^\/(brand-growth|services|contact|book|strategy-call|journey|free-growth-tools|diagnostics)$/i.test(
      path,
    )
  ) {
    return 0.95;
  }
  if (path.startsWith("/offers/") || path.startsWith("/blog/")) return 0.9;
  if (path === "/blog") return 0.88;
  if (path.startsWith("/website-breakdowns")) return 0.82;
  if (path.startsWith("/challenge") && !path.includes("/dashboard") && !path.includes("/checkout")) {
    return 0.75;
  }
  if (path.startsWith("/launch-") || path.endsWith("-growth") || path.includes("contractor")) {
    return 0.85;
  }
  return 0.65;
}

async function publishedBlogEntries(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  try {
    const now = new Date();
    const rows = await db
      .select({
        slug: blogPosts.slug,
        publishedAt: blogPosts.publishedAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), lte(blogPosts.publishedAt, now)))
      .orderBy(desc(blogPosts.publishedAt));

    return rows.map((r) => {
      const path = `/blog/${r.slug}`;
      const lastRaw = r.updatedAt ?? r.publishedAt ?? now;
      const lastModified =
        lastRaw instanceof Date ? lastRaw : new Date(lastRaw as string | number);
      const safeLastModified = Number.isNaN(lastModified.getTime()) ? now : lastModified;
      return {
        url: absolutePath(path),
        lastModified: safeLastModified,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      };
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routeAudienceByPath = new Map(SITE_DIRECTORY_ENTRIES_UNIQUE.map((entry) => [entry.path, entry.audience]));
  const staticPublic = SITE_DIRECTORY_ENTRIES_UNIQUE.filter(
    (e) => e.audience === "public" && !e.path.includes("[") && !isExcludedPath(e.path),
  );
  const discoveredStaticPaths = await discoverStaticPageRoutes(APP_DIR);
  const discoveredPublic: MetadataRoute.Sitemap = [...discoveredStaticPaths]
    .filter((routePath) => {
      const audience = routeAudienceByPath.get(routePath);
      return !audience || audience === "public";
    })
    .map((routePath) => ({
      url: absolutePath(routePath),
      lastModified: new Date(),
      changeFrequency: changeFrequency(routePath),
      priority: priority(routePath),
    }))
    .filter((entry) => isValidHttpUrlForSitemap(entry.url));

  const fromDirectory: MetadataRoute.Sitemap = staticPublic
    .map((e) => ({
      url: absolutePath(e.path),
      lastModified: new Date(),
      changeFrequency: changeFrequency(e.path),
      priority: priority(e.path),
    }))
    .filter((e) => isValidHttpUrlForSitemap(e.url));

  const breakdowns: MetadataRoute.Sitemap = WEBSITE_BREAKDOWNS.map((b) => {
    const lm = new Date(b.publishedAt);
    return {
      url: absolutePath(`/website-breakdowns/${b.slug}`),
      lastModified: Number.isNaN(lm.getTime()) ? new Date() : lm,
      changeFrequency: "monthly" as const,
      priority: 0.82,
    };
  }).filter((e) => isValidHttpUrlForSitemap(e.url));

  const blogPostsEntries = (await publishedBlogEntries()).filter((e) =>
    isValidHttpUrlForSitemap(e.url),
  );

  const urlSeen = new Set<string>();
  const merged: MetadataRoute.Sitemap = [];
  for (const entry of [...fromDirectory, ...discoveredPublic, ...breakdowns, ...blogPostsEntries]) {
    if (!isValidHttpUrlForSitemap(entry.url) || urlSeen.has(entry.url)) continue;
    urlSeen.add(entry.url);
    merged.push(entry);
  }

  merged.sort((a, b) => {
    const pa = typeof a.priority === "number" ? a.priority : 0;
    const pb = typeof b.priority === "number" ? b.priority : 0;
    if (pb !== pa) return pb - pa;
    return a.url.localeCompare(b.url);
  });

  return merged;
}
