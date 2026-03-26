/**
 * Fetches live HTML from this deployment’s public marketing routes so the admin AI
 * can ground answers in real on-site copy (headings, body text). Only paths listed
 * in the site directory as audience "public" without dynamic segments are allowed.
 */

import { parse } from "node-html-parser";
import { stripConversationalSearchNoise } from "@/lib/advancedSearchQuery";
import { SITE_DIRECTORY_ENTRIES_UNIQUE, searchSiteDirectory } from "@/lib/siteDirectory";

const MAX_PAGES = 5;
const MAX_CHARS_PER_PAGE = 3200;
const FETCH_TIMEOUT_MS = 9000;

const publicStaticPathSet = new Set(
  SITE_DIRECTORY_ENTRIES_UNIQUE.filter((e) => e.audience === "public" && !e.path.includes("[")).map((e) => e.path),
);

/** Canonical site origin for server-side HTTP fetches (no trailing slash). */
export function resolveAgentSiteOrigin(): string | null {
  const explicit = process.env.ADMIN_AGENT_SITE_BASE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      /* fall through */
    }
  }
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub) {
    try {
      return new URL(pub).origin;
    } catch {
      /* fall through */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  const nextAuth = process.env.NEXTAUTH_URL?.trim();
  if (nextAuth) {
    try {
      return new URL(nextAuth).origin;
    } catch {
      /* fall through */
    }
  }
  return null;
}

/**
 * Whether to attach live HTML snippets for this turn.
 * - crawlSite true: always (within path limits).
 * - crawlSite false: never.
 * - undefined: keyword / env heuristic.
 */
export function shouldAttachSiteCrawl(message: string, crawlSite?: boolean): boolean {
  if (crawlSite === false) return false;
  if (crawlSite === true) return true;

  const always = process.env.ADMIN_AGENT_ALWAYS_CRAWL_SITE?.trim();
  if (always === "1" || always?.toLowerCase() === "true" || always?.toLowerCase() === "yes") {
    return true;
  }

  const lower = message.toLowerCase();
  if (/\bhttps?:\/\//.test(message)) {
    return false;
  }

  return /\b(our site|the site|this site|website|homepage|home page|marketing page|marketing site|marketing copy|public page|live site|visitors? see|published copy|on-page|what's on|what is on|\bcrawl\b|ground(?:ed)? in (?:the )?site|accurate (?:to )?(?:the )?site|verify (?:against )?(?:the )?site|services page|contact page|landing copy|meta description|hero text|hero copy)\b/i.test(
    lower,
  );
}

function normalizePublicPath(p: string): string | null {
  const s = p.split("?")[0].split("#")[0].trim();
  if (!s.startsWith("/") || s.includes("..") || s.includes("//")) return null;
  if (s.includes("[") || s.includes("]")) return null;
  return publicStaticPathSet.has(s) ? s : null;
}

/** Resolve paths to crawl: message hints, site-directory search, current public URL. */
export function pickPublicPathsForCrawl(message: string, currentPath?: string): string[] {
  const out: string[] = [];
  const add = (p: string | null | undefined) => {
    if (!p) return;
    const n = normalizePublicPath(p);
    if (n && !out.includes(n)) out.push(n);
  };

  add(currentPath);

  const pathRegex = /(?:^|[\s"'[(])(\/[a-z0-9][a-z0-9\-/]*)(?=[\s"'')\],.?]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = pathRegex.exec(message)) !== null) {
    add(m[1]);
  }

  const cleaned = stripConversationalSearchNoise(message);
  const q = cleaned.length >= 2 ? cleaned : message.trim();
  if (q.length >= 2) {
    const hits = searchSiteDirectory(q);
    for (const e of hits) {
      if (e.audience === "public" && !e.path.includes("[")) {
        add(e.path);
      }
      if (out.length >= MAX_PAGES) break;
    }
  }

  const lower = message.toLowerCase();
  if (/\b(homepage|home page|^landing\b)\b/.test(lower)) add("/");
  if (/\bservices\b/.test(lower)) add("/services");
  if (/\bcontact\b/.test(lower)) add("/contact");
  if (/\bfaq\b/.test(lower)) add("/faq");
  if (/\babout\b/.test(lower)) add("/about");
  if (/\bfree growth tools\b/.test(lower)) add("/free-growth-tools");
  if (/\bbrand growth\b/.test(lower)) add("/brand-growth");

  if (out.length === 0) add("/");

  return out.slice(0, MAX_PAGES);
}

function htmlToExcerpt(html: string): { title: string; metaDescription: string; body: string } {
  const root = parse(html, { lowerCaseTagName: true });
  root.querySelectorAll("script, style, noscript, svg, iframe").forEach((el) => el.remove());
  const title = root.querySelector("title")?.text?.trim() ?? "";
  const metaDescription =
    root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ??
    root.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() ??
    "";
  const bodyEl = root.querySelector("body");
  let body = (bodyEl?.text ?? root.text ?? "").replace(/\s+/g, " ").trim();
  if (body.length > MAX_CHARS_PER_PAGE) {
    body = `${body.slice(0, MAX_CHARS_PER_PAGE)}…`;
  }
  return { title, metaDescription, body };
}

async function fetchPublicPage(
  origin: string,
  pathname: string,
): Promise<{ pathname: string; title: string; ok: boolean; text: string }> {
  let url: URL;
  try {
    url = new URL(pathname, origin);
  } catch {
    return { pathname, title: "", ok: false, text: "(invalid URL)" };
  }
  if (url.origin !== origin) {
    return { pathname, title: "", ok: false, text: "(origin mismatch)" };
  }

  try {
    const res = await fetch(url.href, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "AscendraAdminAgent/1.0 (+internal-site-grounding)",
      },
    });
    if (!res.ok) {
      return { pathname, title: "", ok: false, text: `HTTP ${res.status}` };
    }
    const html = await res.text();
    const { title, metaDescription, body } = htmlToExcerpt(html);
    const head = [metaDescription ? `Meta: ${metaDescription}` : ""].filter(Boolean).join("\n");
    const text = [head, body].filter(Boolean).join("\n\n");
    return { pathname, title: title || pathname, ok: true, text: text || "(empty body)" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return { pathname, title: "", ok: false, text: msg };
  }
}

/** Markdown-style block for the model: static ## headers only (no user input in headers). */
export async function buildSiteCrawlContextBlock(
  message: string,
  currentPath?: string,
  crawlSite?: boolean,
): Promise<string> {
  if (!shouldAttachSiteCrawl(message, crawlSite)) {
    return "";
  }

  const origin = resolveAgentSiteOrigin();
  if (!origin) {
    return "";
  }

  const paths = pickPublicPathsForCrawl(message, currentPath);
  const rows = await Promise.all(paths.map((p) => fetchPublicPage(origin, p)));

  const chunks = rows.map((r) => {
    const label = r.title && r.title !== r.pathname ? `${r.pathname} — ${r.title}` : r.pathname;
    if (!r.ok) {
      return `### ${label}\n(Fetch failed: ${r.text})`;
    }
    return `### ${label}\n${r.text}`;
  });

  return [
    `## Live public pages (HTML excerpts fetched from this deployment: ${origin})`,
    "Use for accurate visitor-facing copy, CTAs, and claims. Excerpts may truncate; prefer short quotes. Do not confuse with admin UI.",
    "",
    ...chunks,
  ].join("\n");
}
