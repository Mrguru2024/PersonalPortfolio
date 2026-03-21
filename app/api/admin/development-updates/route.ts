import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONTENT_PATH = join(process.cwd(), "content", "development-updates.md");

const FETCH_TIMEOUT_MS = 15_000;

/** Cap branch scans to avoid long requests and rate limits (each branch = one fetch). */
const MAX_BRANCHES = Math.min(
  Math.max(5, parseInt(process.env.DEVELOPMENT_UPDATES_MAX_BRANCHES ?? "40", 10) || 40),
  100,
);

const FETCH_CONCURRENCY = Math.min(
  12,
  Math.max(2, parseInt(process.env.DEVELOPMENT_UPDATES_BRANCH_FETCH_CONCURRENCY ?? "8", 10) || 8),
);

/**
 * Default: single branch only — the ref in DEVELOPMENT_UPDATES_RAW_URL (use main in the URL for production).
 * Set DEVELOPMENT_UPDATES_MULTI_BRANCH=true to merge the same file from every GitHub branch (not recommended for most setups).
 */
function multiBranchEnabled(): boolean {
  const v = process.env.DEVELOPMENT_UPDATES_MULTI_BRANCH?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Required by GitHub; missing UA often causes 403 on raw + API. */
const GITHUB_USER_AGENT =
  process.env.DEVELOPMENT_UPDATES_USER_AGENT ||
  "AscendraPortfolio-Admin/1.0 (development-updates; +https://github.com/Mrguru2024/PersonalPortfolio)";

/**
 * Public raw URL for the branch to read (typically main).
 * e.g. https://raw.githubusercontent.com/OWNER/REPO/main/content/development-updates.md
 */
const GITHUB_RAW_URL =
  process.env.DEVELOPMENT_UPDATES_RAW_URL ||
  "https://raw.githubusercontent.com/Mrguru2024/PersonalPortfolio/main/content/development-updates.md";

/** Optional: owner/repo when raw URL is not parseable (used with GitHub API fallback). */
const GITHUB_REPO_OVERRIDE = process.env.DEVELOPMENT_UPDATES_GITHUB_REPO?.trim();
const GITHUB_REF_OVERRIDE = process.env.DEVELOPMENT_UPDATES_GITHUB_REF?.trim() || "main";
const GITHUB_PATH_OVERRIDE =
  process.env.DEVELOPMENT_UPDATES_GITHUB_PATH?.trim() || "content/development-updates.md";

export interface DevelopmentUpdateEntry {
  date: string;
  time?: string;
  title: string;
  items: string[];
  /** When merged from GitHub across branches: which branches contained this section */
  sourceBranches?: string[];
}

export interface DevelopmentUpdatesMergeInfo {
  branchesScanned: number;
  branchesWithFile: number;
  mode: "multi_branch" | "single_branch";
}

function toPlainText(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

function normalizeTime(t: string): string {
  const trimmed = t.trim();
  if (!trimmed) return "";
  return trimmed;
}

function parseUpdatesMarkdown(raw: string): DevelopmentUpdateEntry[] {
  const entries: DevelopmentUpdateEntry[] = [];
  const blocks = raw.split(/\n##\s+/).filter(Boolean);
  for (const block of blocks) {
    const firstLine = block.trim().split("\n")[0] ?? "";
    const dateOnlyMatch = firstLine.match(/^(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+)$/);
    const dateTimeMatch = firstLine.match(
      /^(\d{4}-\d{2}-\d{2})(?:[\sT](\d{1,2}:\d{2}(?:\s*[AP]M)?|\d{2}:\d{2}))?\s*[—–-]\s*(.+)$/,
    );
    const match = dateTimeMatch || dateOnlyMatch;
    if (!match) continue;
    const date = match[1] ?? "";
    const timeRaw = match[2]?.trim();
    const title = (dateTimeMatch ? match[3] : match[2]) ?? "";
    const time = timeRaw ? normalizeTime(timeRaw) : undefined;
    const rest = block.slice(firstLine.length).trim();
    const items = rest
      .split(/\n/)
      .map((line) => toPlainText(line.replace(/^\s*[-*]\s+/, "")))
      .filter(Boolean);
    entries.push({
      date,
      ...(time ? { time } : {}),
      title: toPlainText(title.trim()),
      items,
    });
  }
  return entries;
}

/** Parse owner/repo/ref/path from raw.githubusercontent.com URL. */
function parseGithubRawUrl(
  url: string,
): { owner: string; repo: string; ref: string; path: string } | null {
  try {
    const base = url.split("?")[0] ?? url;
    const u = new URL(base);
    if (u.hostname !== "raw.githubusercontent.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 4) return null;
    const [owner, repo, ref, ...rest] = parts;
    if (!owner || !repo || !ref || rest.length === 0) return null;
    return { owner, repo, ref, path: rest.join("/") };
  } catch {
    return null;
  }
}

/** Repo + file path for multi-branch fetch (no ref). */
function resolveGithubRepoAndPath(): { owner: string; repo: string; path: string } | null {
  if (GITHUB_REPO_OVERRIDE) {
    const m = GITHUB_REPO_OVERRIDE.match(/^([^/]+)\/([^/]+)$/);
    if (!m) return null;
    return { owner: m[1]!, repo: m[2]!, path: GITHUB_PATH_OVERRIDE };
  }
  const parsed = parseGithubRawUrl(GITHUB_RAW_URL);
  if (!parsed) return null;
  return { owner: parsed.owner, repo: parsed.repo, path: parsed.path };
}

function resolveGithubCoordinates(): { owner: string; repo: string; ref: string; path: string } | null {
  if (GITHUB_REPO_OVERRIDE) {
    const m = GITHUB_REPO_OVERRIDE.match(/^([^/]+)\/([^/]+)$/);
    if (!m) return null;
    return { owner: m[1]!, repo: m[2]!, ref: GITHUB_REF_OVERRIDE, path: GITHUB_PATH_OVERRIDE };
  }
  return parseGithubRawUrl(GITHUB_RAW_URL);
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchRawFromGitHub(): Promise<string | null> {
  try {
    const url = GITHUB_RAW_URL + (GITHUB_RAW_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
    const res = await fetchWithTimeout(url, {
      headers: {
        Accept: "text/plain",
        "User-Agent": GITHUB_USER_AGENT,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const snippet = await res.text().catch(() => "");
      console.warn(
        "[development-updates] raw.githubusercontent.com",
        res.status,
        snippet.slice(0, 120).replace(/\s+/g, " "),
      );
      return null;
    }
    return await res.text();
  } catch (e) {
    console.warn("[development-updates] raw fetch error", e instanceof Error ? e.message : e);
    return null;
  }
}

interface GitHubContentFile {
  content?: string;
  encoding?: string;
  message?: string;
}

async function fetchViaGitHubContentsApi(
  coords: { owner: string; repo: string; ref: string; path: string },
  token: string,
): Promise<string | null> {
  const pathSeg = coords.path
    .split("/")
    .filter(Boolean)
    .map((p) => encodeURIComponent(p))
    .join("/");
  const url = `https://api.github.com/repos/${coords.owner}/${coords.repo}/contents/${pathSeg}?ref=${encodeURIComponent(coords.ref)}`;
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": GITHUB_USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn(
        "[development-updates] GitHub API contents",
        res.status,
        errBody.slice(0, 200).replace(/\s+/g, " "),
      );
      return null;
    }
    const data = (await res.json()) as GitHubContentFile;
    if (data.encoding !== "base64" || typeof data.content !== "string") {
      console.warn("[development-updates] GitHub API: unexpected payload (not a single file?)");
      return null;
    }
    const buf = Buffer.from(data.content.replace(/\n/g, ""), "base64");
    return buf.toString("utf-8");
  } catch (e) {
    console.warn("[development-updates] GitHub API error", e instanceof Error ? e.message : e);
    return null;
  }
}

function githubToken(): string | undefined {
  return (
    process.env.DEVELOPMENT_UPDATES_GITHUB_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim() || undefined
  );
}

/** List branch names (newest pages first from API; we cap total). */
async function listGithubBranches(
  owner: string,
  repo: string,
  token: string | undefined,
): Promise<string[] | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": GITHUB_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const names: string[] = [];
  let page = 1;
  try {
    while (names.length < MAX_BRANCHES && page <= 10) {
      const url = `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100&page=${page}`;
      const res = await fetchWithTimeout(url, { headers, cache: "no-store", next: { revalidate: 0 } });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn("[development-updates] list branches", res.status, body.slice(0, 160));
        return null;
      }
      const arr = (await res.json()) as { name: string }[];
      if (!Array.isArray(arr) || arr.length === 0) break;
      for (const b of arr) {
        names.push(b.name);
        if (names.length >= MAX_BRANCHES) break;
      }
      if (arr.length < 100) break;
      page++;
    }
  } catch (e) {
    console.warn("[development-updates] list branches error", e instanceof Error ? e.message : e);
    return null;
  }
  return names;
}

/** Prefer main/master first, then alphabetical (stable, predictable). */
function sortBranchesForFetch(names: string[]): string[] {
  const set = new Set(names);
  const preferred = ["main", "master"].filter((b) => set.has(b));
  const rest = names.filter((b) => !preferred.includes(b)).sort((a, b) => a.localeCompare(b));
  return [...preferred, ...rest];
}

async function fetchMarkdownForBranch(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token: string | undefined,
): Promise<string | null> {
  /** Branch names with "/" must use %2F in the raw URL path segment. */
  const refEnc = encodeURIComponent(branch);
  const pathParts = filePath.split("/").filter(Boolean).map((p) => encodeURIComponent(p));
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${refEnc}/${pathParts.join("/")}`;
  const url = rawUrl + (rawUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        Accept: "text/plain",
        "User-Agent": GITHUB_USER_AGENT,
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (res.ok) return await res.text();
  } catch {
    /* fall through */
  }
  if (token) {
    return fetchViaGitHubContentsApi({ owner, repo, ref: branch, path: filePath }, token);
  }
  return null;
}

async function poolMap<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (true) {
      const i = index++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]!);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

type MergedEntry = DevelopmentUpdateEntry & { sourceBranches: string[] };

function mergeParsedFromBranch(
  parsed: DevelopmentUpdateEntry[],
  branch: string,
  byKey: Map<string, MergedEntry>,
) {
  for (const e of parsed) {
    const key = `${e.date}\0${e.title.trim().toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        ...e,
        sourceBranches: [branch],
      });
    } else {
      const branches = new Set([...existing.sourceBranches, branch]);
      existing.sourceBranches = [...branches].sort((a, b) => a.localeCompare(b));
      const seen = new Set(existing.items);
      for (const it of e.items) {
        if (!seen.has(it)) {
          seen.add(it);
          existing.items.push(it);
        }
      }
      if (!existing.time && e.time) existing.time = e.time;
    }
  }
}

function sortMergedUpdates(entries: MergedEntry[]): DevelopmentUpdateEntry[] {
  const sorted = [...entries].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return a.title.localeCompare(b.title);
  });
  return sorted.map((e) => {
    if (e.sourceBranches.length <= 1) {
      const { sourceBranches: _sb, ...rest } = e;
      return rest;
    }
    return e;
  });
}

/**
 * Load markdown from every listed branch that has the file; merge sections by date+title.
 */
async function loadRemoteMarkdownMultiBranch(): Promise<{
  updates: DevelopmentUpdateEntry[];
  remote: "github_raw" | "github_api";
  mergeInfo: DevelopmentUpdatesMergeInfo;
  sourceNote?: string;
} | null> {
  const repoPath = resolveGithubRepoAndPath();
  if (!repoPath) return null;

  const token = githubToken();
  let branches = await listGithubBranches(repoPath.owner, repoPath.repo, token);
  if (!branches?.length) return null;

  branches = sortBranchesForFetch(branches);
  const usedApi = !!token;

  const payloads = await poolMap(branches, FETCH_CONCURRENCY, async (branch) => {
    const md = await fetchMarkdownForBranch(
      repoPath.owner,
      repoPath.repo,
      branch,
      repoPath.path,
      token,
    );
    return { branch, md };
  });

  const byKey = new Map<string, MergedEntry>();
  let branchesWithFile = 0;
  for (const { branch, md } of payloads) {
    if (!md?.trim()) continue;
    branchesWithFile++;
    mergeParsedFromBranch(parseUpdatesMarkdown(md), branch, byKey);
  }

  if (branchesWithFile === 0) return null;

  const updates = sortMergedUpdates([...byKey.values()]);
  const mergeInfo: DevelopmentUpdatesMergeInfo = {
    branchesScanned: branches.length,
    branchesWithFile,
    mode: "multi_branch",
  };

  let sourceNote: string | undefined;
  if (usedApi) {
    sourceNote =
      "Loaded via GitHub (branches API + per-branch file). Token used for private repo or API fallback.";
  }
  if (branches.length >= MAX_BRANCHES) {
    sourceNote =
      (sourceNote ? sourceNote + " " : "") +
      `Only the first ${MAX_BRANCHES} branches (GitHub API page cap) were scanned; raise DEVELOPMENT_UPDATES_MAX_BRANCHES if needed.`;
  }

  return {
    updates,
    remote: usedApi ? "github_api" : "github_raw",
    mergeInfo,
    sourceNote,
  };
}

/** Single-branch: raw URL then Contents API fallback. */
async function loadRemoteMarkdownSingle(): Promise<{ body: string; remote: "github_raw" | "github_api" } | null> {
  const raw = await fetchRawFromGitHub();
  if (raw?.trim()) return { body: raw, remote: "github_raw" };

  const token = githubToken();
  const coords = resolveGithubCoordinates();
  if (token && coords) {
    const fromApi = await fetchViaGitHubContentsApi(coords, token);
    if (fromApi?.trim()) return { body: fromApi, remote: "github_api" };
  }

  return null;
}

/**
 * GET /api/admin/development-updates
 * Production: GitHub — reads content/development-updates.md from the branch in DEVELOPMENT_UPDATES_RAW_URL (main by default).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    let updates: DevelopmentUpdateEntry[] = [];
    let source: "file" | "github" = "file";
    let sourceNote: string | undefined;
    let mergeInfo: DevelopmentUpdatesMergeInfo | undefined;

    if (isProduction) {
      if (multiBranchEnabled()) {
        const multi = await loadRemoteMarkdownMultiBranch();
        if (multi && multi.updates.length > 0) {
          updates = multi.updates;
          source = "github";
          mergeInfo = multi.mergeInfo;
          sourceNote = multi.sourceNote;
        } else {
          const remote = await loadRemoteMarkdownSingle();
          if (remote) {
            updates = parseUpdatesMarkdown(remote.body);
            source = "github";
            mergeInfo = {
              branchesScanned: 1,
              branchesWithFile: 1,
              mode: "single_branch",
            };
            if (remote.remote === "github_api") {
              sourceNote =
                "Merged branch list unavailable or no file on branches; using single branch from DEVELOPMENT_UPDATES_RAW_URL (GitHub API).";
            } else {
              sourceNote =
                "Merged branch list unavailable or no matches; using single branch from DEVELOPMENT_UPDATES_RAW_URL.";
            }
          } else {
            sourceNote =
              "Could not load from GitHub. Set DEVELOPMENT_UPDATES_RAW_URL (or DEVELOPMENT_UPDATES_GITHUB_REPO + path), add GITHUB_TOKEN for private repos, and ensure the repo allows branch listing.";
          }
        }
      } else {
        const remote = await loadRemoteMarkdownSingle();
        if (remote) {
          updates = parseUpdatesMarkdown(remote.body);
          source = "github";
          mergeInfo = {
            branchesScanned: 1,
            branchesWithFile: 1,
            mode: "single_branch",
          };
          if (remote.remote === "github_api") {
            sourceNote = "Loaded via GitHub API (single-branch mode: DEVELOPMENT_UPDATES_MULTI_BRANCH=false).";
          }
        } else {
          sourceNote =
            "Could not load live file from GitHub. Check DEVELOPMENT_UPDATES_RAW_URL and token for private repos.";
        }
      }
    } else {
      if (existsSync(CONTENT_PATH)) {
        const raw = readFileSync(CONTENT_PATH, "utf-8");
        updates = parseUpdatesMarkdown(raw);
        source = "file";
      }
    }

    if (updates.length === 0 && existsSync(CONTENT_PATH)) {
      const raw = readFileSync(CONTENT_PATH, "utf-8");
      updates = parseUpdatesMarkdown(raw);
      if (isProduction) {
        source = "file";
        mergeInfo = undefined;
        sourceNote =
          (sourceNote ? sourceNote + " " : "") +
          "Showing bundled/workspace copy from content/development-updates.md.";
      }
    }

    const res = NextResponse.json({
      updates,
      source,
      sourceNote: sourceNote ?? undefined,
      mergeInfo,
    });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (error) {
    console.error("Development updates read error:", error);
    return NextResponse.json({ updates: [], error: "Failed to load updates" }, { status: 500 });
  }
}
