import Parser from "rss-parser";
import { stripHtmlToText } from "./stripHtml";
import type { PublicUpdateEntryOut, PublicUpdatesTopic } from "./types";

const PARSER_TIMEOUT_MS = 12_000;

/** External RSS only — never `ascendra_public` (those come from `content/public-updates.json`). */
const FEED_TOPICS = new Set<PublicUpdatesTopic>(["marketing", "digital_marketing", "advertising"]);

type CuratedFeedSource = {
  topic: PublicUpdatesTopic;
  sourceName: string;
  feedUrl: string;
  maxItems: number;
};

function dedupeSources(sources: CuratedFeedSource[]): CuratedFeedSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const k = s.feedUrl.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseExtraFeedSourcesFromEnv(): CuratedFeedSource[] {
  const raw = process.env.PUBLIC_MARKET_FEED_URLS?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: CuratedFeedSource[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const topic = r.topic;
      const sourceName = r.sourceName;
      const feedUrl = r.feedUrl;
      if (typeof topic !== "string" || !FEED_TOPICS.has(topic as PublicUpdatesTopic)) continue;
      if (typeof sourceName !== "string" || typeof feedUrl !== "string") continue;
      const sn = sourceName.trim();
      const fu = feedUrl.trim();
      if (!sn || !fu) continue;
      const maxItemsRaw = r.maxItems;
      const maxItems =
        typeof maxItemsRaw === "number" && Number.isFinite(maxItemsRaw)
          ? Math.max(1, Math.min(15, Math.floor(maxItemsRaw)))
          : 6;
      out.push({ topic: topic as PublicUpdatesTopic, sourceName: sn, feedUrl: fu, maxItems });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Established trade / publisher RSS only. Readers verify claims at the source.
 * Extend via `PUBLIC_MARKET_FEED_URLS` (JSON array of `{ topic, sourceName, feedUrl, maxItems? }`).
 */
const DEFAULT_SOURCES: CuratedFeedSource[] = dedupeSources([
  {
    topic: "marketing",
    sourceName: "HubSpot",
    feedUrl: "https://blog.hubspot.com/marketing/rss.xml",
    maxItems: 10,
  },
  {
    topic: "marketing",
    sourceName: "Content Marketing Institute",
    feedUrl: "https://contentmarketinginstitute.com/feed/",
    maxItems: 8,
  },
  {
    topic: "digital_marketing",
    sourceName: "Search Engine Land",
    feedUrl: "https://searchengineland.com/feed",
    maxItems: 10,
  },
  {
    topic: "digital_marketing",
    sourceName: "Moz",
    feedUrl: "https://moz.com/posts/rss/blog",
    maxItems: 8,
  },
  {
    topic: "advertising",
    sourceName: "Adweek",
    feedUrl: "https://www.adweek.com/feed/",
    maxItems: 8,
  },
  {
    topic: "advertising",
    sourceName: "WordStream",
    feedUrl: "https://www.wordstream.com/blog/feed",
    maxItems: 8,
  },
  ...parseExtraFeedSourcesFromEnv(),
]);

let memoryCache: { at: number; items: PublicUpdateEntryOut[] } | null = null;
/** Short TTL so repeat API calls (polling) pick up new headlines without hammering publishers on every request. */
const MEMORY_TTL_MS = 35_000;

function feedsDisabled(): boolean {
  return process.env.PUBLIC_MARKET_FEEDS === "0" || process.env.PUBLIC_MARKET_FEEDS === "false";
}

function stableId(topic: PublicUpdatesTopic, link: string, title: string): string {
  const key = `${topic}|${link}|${title}`.slice(0, 400);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return `feed:${topic}:${Math.abs(h).toString(36)}`;
}

function parseRfc822Date(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function fetchOneSource(src: CuratedFeedSource): Promise<PublicUpdateEntryOut[]> {
  const parser: Parser = new Parser({
    timeout: PARSER_TIMEOUT_MS,
    headers: {
      "User-Agent": "AscendraPublicUpdates/1.0 (+https://ascendratechnologies.com/updates)",
      Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
    },
  });

  let feed;
  try {
    feed = await parser.parseURL(src.feedUrl);
  } catch {
    return [];
  }

  const items = feed.items ?? [];
  const out: PublicUpdateEntryOut[] = [];

  for (const item of items) {
    if (out.length >= src.maxItems) break;
    const title = (item.title ?? "").trim();
    const link = (item.link ?? "").trim();
    if (!title || !link) continue;

    const rawContent =
      (item as { content?: string }).content ??
      (item as { "content:encoded"?: string })["content:encoded"] ??
      item.contentSnippet ??
      "";
    const summarySource = item.contentSnippet || rawContent || item.summary || "";
    const description = stripHtmlToText(summarySource, 280) || title;
    const detailsFull = stripHtmlToText(rawContent || summarySource, 20_000);
    const details = (() => {
      if (!detailsFull) return null;
      if (detailsFull.length > description.length + 12) return detailsFull;
      if (detailsFull.length > 420 && description.length <= 300) return detailsFull;
      return detailsFull !== description && detailsFull.length > description.length ? detailsFull : null;
    })();

    const date =
      parseRfc822Date(item.pubDate) ??
      parseRfc822Date(item.isoDate) ??
      new Date().toISOString();

    out.push({
      id: stableId(src.topic, link, title),
      date,
      title,
      description,
      details,
      topic: src.topic,
      factChecked: false,
      sourceName: src.sourceName,
      sourceUrl: link,
      kind: "publisher_feed",
    });
  }

  return out;
}

/** Cached ~35s to balance near–real-time freshness vs. upstream rate limits. */
export async function fetchCuratedFeedItems(): Promise<PublicUpdateEntryOut[]> {
  if (feedsDisabled()) return [];

  const now = Date.now();
  if (memoryCache && now - memoryCache.at < MEMORY_TTL_MS) {
    return memoryCache.items;
  }

  const results = await Promise.all(DEFAULT_SOURCES.map((s) => fetchOneSource(s)));
  const merged = results.flat();

  memoryCache = { at: now, items: merged };
  return merged;
}
