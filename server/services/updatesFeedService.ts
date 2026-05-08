import Parser from "rss-parser";
import { storage } from "../storage";
import { readPublicUpdates, type PublicUpdateCategory } from "@/lib/publicUpdatesReader";
import type { UpdatesFeedItem, UpdatesFeedResponse } from "@/lib/updatesFeedTypes";
import type { UpdatesTopicId } from "@/lib/updatesFeedTopics";
import { blogSeedPosts } from "@/lib/blogSeedData";

/** Short TTL so /updates polling sees fresh items without hammering publishers on every request. */
const CACHE_TTL_MS = 45_000;
const PER_RSS_SOURCE_LIMIT = 6;
const MAX_ITEMS = 120;
const FETCH_MS = 12_000;

/** Multiple reputable feeds per topic; failures are ignored per-source (Promise.allSettled). */
const RSS_SOURCES: { url: string; sourceName: string; topic: UpdatesTopicId }[] = [
  {
    url: "https://blog.hubspot.com/marketing/rss.xml",
    sourceName: "HubSpot Marketing",
    topic: "marketing",
  },
  {
    url: "https://blog.hootsuite.com/feed/",
    sourceName: "Hootsuite Blog",
    topic: "marketing",
  },
  {
    url: "https://buffer.com/resources/feed/",
    sourceName: "Buffer Resources",
    topic: "marketing",
  },
  {
    url: "https://www.searchenginejournal.com/how-to/feed/",
    sourceName: "Search Engine Journal (how-to)",
    topic: "tips_how_to",
  },
  {
    url: "https://ahrefs.com/blog/feed/",
    sourceName: "Ahrefs Blog",
    topic: "tips_how_to",
  },
  {
    url: "https://www.socialmediaexaminer.com/feed/",
    sourceName: "Social Media Examiner",
    topic: "tips_how_to",
  },
  {
    url: "https://moz.com/posts/rss/blog",
    sourceName: "Moz",
    topic: "digital_marketing",
  },
  {
    url: "https://searchengineland.com/feed",
    sourceName: "Search Engine Land",
    topic: "digital_marketing",
  },
  {
    url: "https://www.socialmediatoday.com/feeds/news/",
    sourceName: "Social Media Today",
    topic: "industry_news",
  },
  {
    url: "https://martech.org/feed/",
    sourceName: "MarTech",
    topic: "industry_news",
  },
  {
    url: "https://www.marketingdive.com/feeds/news/",
    sourceName: "Marketing Dive",
    topic: "industry_news",
  },
];

let memoryCache: { expires: number; payload: UpdatesFeedResponse } | null = null;

function topicsForPublicCategory(category: PublicUpdateCategory): UpdatesTopicId[] {
  switch (category) {
    case "marketing_industry_update":
      return ["marketing", "industry_news"];
    case "persona_interest":
      return ["marketing"];
    case "new_project_intake":
      return ["ascendra_public"];
    default:
      return ["ascendra_public"];
  }
}

function stripHtml(html: string, maxLen: number): string {
  const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trimEnd()}…`;
}

function stableId(parts: string[]): string {
  return parts.join("|").slice(0, 200);
}

async function fetchRssSource(
  parser: Parser,
  url: string,
  sourceName: string,
  topic: UpdatesTopicId,
): Promise<UpdatesFeedItem[]> {
  const feed = await parser.parseURL(url);
  const items: UpdatesFeedItem[] = [];
  const raw = feed.items ?? [];
  for (let i = 0; i < raw.length && i < PER_RSS_SOURCE_LIMIT; i++) {
    const it = raw[i];
    const link = typeof it.link === "string" ? it.link.trim() : "";
    const title = typeof it.title === "string" ? it.title.trim() : "";
    if (!link || !title) continue;
    const pub =
      it.pubDate || it.isoDate || (it as { dc?: string }).dc || new Date().toISOString();
    const parsed = new Date(pub);
    const publishedAt = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    const snippet =
      typeof it.contentSnippet === "string" && it.contentSnippet.trim()
        ? stripHtml(it.contentSnippet, 320)
        : typeof it.content === "string"
          ? stripHtml(it.content, 320)
          : "";
    const summary = snippet || "Open the article for the full story.";
    items.push({
      id: stableId(["rss", topic, link, publishedAt]),
      topics: [topic],
      title,
      summary,
      url: link,
      sourceName,
      publishedAt,
      kind: "rss",
    });
  }
  return items;
}

async function loadRssItems(): Promise<UpdatesFeedItem[]> {
  const parser = new Parser({
    timeout: FETCH_MS,
    headers: {
      "User-Agent": "AscendraPortfolio/1.0 (public updates aggregator; +https://ascendratechnologies.com)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });

  const results = await Promise.allSettled(
    RSS_SOURCES.map((s) => fetchRssSource(parser, s.url, s.sourceName, s.topic)),
  );

  const out: UpdatesFeedItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(...r.value);
  }
  return out;
}

function seedBlogFeedItems(): UpdatesFeedItem[] {
  const items: UpdatesFeedItem[] = [];
  for (const p of blogSeedPosts.slice(0, 12)) {
    const publishedAt = new Date(
      typeof p.publishedAt === "string" ? p.publishedAt : (p.publishedAt as Date) ?? Date.now(),
    ).toISOString();
    items.push({
      id: stableId(["blog", p.slug, publishedAt]),
      topics: ["ascendra_public"],
      title: p.title,
      summary: stripHtml(p.summary ?? "", 280) || "Read on the Ascendra blog.",
      url: `/blog/${p.slug}`,
      sourceName: "Ascendra blog",
      publishedAt,
      kind: "ascendra_blog",
    });
  }
  return items;
}

async function loadAscendraBlogItems(): Promise<UpdatesFeedItem[]> {
  const fallback = seedBlogFeedItems();
  if (!process.env.DATABASE_URL) return fallback;

  try {
    const posts = await storage.getPublishedBlogPosts();
    const items: UpdatesFeedItem[] = [];
    for (const p of posts.slice(0, 15)) {
      const publishedAt =
        p.publishedAt instanceof Date
          ? p.publishedAt.toISOString()
          : new Date(p.publishedAt).toISOString();
      items.push({
        id: stableId(["blog", p.slug, publishedAt]),
        topics: ["ascendra_public"],
        title: p.title,
        summary: stripHtml(p.summary ?? "", 280) || "Read on the Ascendra blog.",
        url: `/blog/${p.slug}`,
        sourceName: "Ascendra blog",
        publishedAt,
        kind: "ascendra_blog",
      });
    }
    return items.length ? items : fallback;
  } catch {
    return fallback;
  }
}

function loadAscendraPublicNotes(): UpdatesFeedItem[] {
  const entries = readPublicUpdates(20);
  return entries.map((e) => ({
    id: stableId(["note", e.date, e.title]),
    topics: topicsForPublicCategory(e.category),
    title: e.title,
    summary: stripHtml(e.description, 360),
    url: null,
    sourceName: "Ascendra market notes",
    publishedAt: e.date,
    kind: "ascendra_note" as const,
  }));
}

function mergeAndSort(items: UpdatesFeedItem[]): UpdatesFeedItem[] {
  const seen = new Set<string>();
  const deduped: UpdatesFeedItem[] = [];
  for (const it of items) {
    const key = it.url ?? it.id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(it);
  }
  return deduped.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, MAX_ITEMS);
}

export async function getUpdatesFeed(forceRefresh = false): Promise<UpdatesFeedResponse> {
  const now = Date.now();
  if (!forceRefresh && memoryCache && memoryCache.expires > now) {
    return memoryCache.payload;
  }

  const [rssItems, blogItems] = await Promise.all([loadRssItems(), loadAscendraBlogItems()]);
  const noteItems = loadAscendraPublicNotes();
  const items = mergeAndSort([...rssItems, ...blogItems, ...noteItems]);

  const payload: UpdatesFeedResponse = {
    items,
    generatedAt: new Date().toISOString(),
    cacheTtlMs: CACHE_TTL_MS,
  };

  memoryCache = { expires: now + CACHE_TTL_MS, payload };
  return payload;
}
