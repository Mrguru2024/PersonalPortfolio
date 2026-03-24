import type { MetadataRoute } from "next";
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
  "/community/inbox",
  "/community/profile",
  "/community/settings",
  "/challenge/checkout",
  "/challenge/dashboard",
];

/** Thank-you / post-conversion URLs (robots noindex or redirect-only) — omit from sitemap. */
const EXCLUDE_EXACT_PATHS = new Set<string>([
  "/thank-you",
  "/call-confirmation",
  "/challenge/thank-you",
]);

function absolutePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function toAbsoluteAsset(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return absolutePath(u.startsWith("/") ? u : `/${u}`);
}

function isExcludedPath(path: string): boolean {
  if (EXCLUDE_EXACT_PATHS.has(path)) return true;
  return EXCLUDE_PREFIXES.some((pre) => path === pre || path.startsWith(`${pre}/`));
}

function changeFrequency(path: string): MetadataRoute.Sitemap[0]["changeFrequency"] {
  if (path === "/") return "daily";
  if (path.startsWith("/blog")) return "weekly";
  if (path.startsWith("/community")) return "daily";
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
        coverImage: blogPosts.coverImage,
        ogImage: blogPosts.ogImage,
      })
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), lte(blogPosts.publishedAt, now)))
      .orderBy(desc(blogPosts.publishedAt));

    return rows.map((r) => {
      const path = `/blog/${r.slug}`;
      const img = toAbsoluteAsset(r.ogImage) ?? toAbsoluteAsset(r.coverImage);
      return {
        url: absolutePath(path),
        lastModified: r.updatedAt ?? r.publishedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
        ...(img ? { images: [img] } : {}),
      };
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPublic = SITE_DIRECTORY_ENTRIES_UNIQUE.filter(
    (e) => e.audience === "public" && !e.path.includes("[") && !isExcludedPath(e.path),
  );

  const fromDirectory: MetadataRoute.Sitemap = staticPublic.map((e) => ({
    url: absolutePath(e.path),
    lastModified: new Date(),
    changeFrequency: changeFrequency(e.path),
    priority: priority(e.path),
  }));

  const breakdowns: MetadataRoute.Sitemap = WEBSITE_BREAKDOWNS.map((b) => ({
    url: absolutePath(`/website-breakdowns/${b.slug}`),
    lastModified: new Date(b.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.82,
  }));

  const blogPostsEntries = await publishedBlogEntries();

  const urlSeen = new Set<string>();
  const merged: MetadataRoute.Sitemap = [];
  for (const entry of [...fromDirectory, ...breakdowns, ...blogPostsEntries]) {
    if (urlSeen.has(entry.url)) continue;
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
