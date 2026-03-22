import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import type { CrmContact } from "@shared/crmSchema";
import type { InsertCrmContactSocialSuggestion } from "@shared/crmSchema";
import {
  buildManualSocialSearchLinks,
  detectSocialPlatformFromUrl,
  normalizeSocialProfileUrl,
  type SocialPlatform,
} from "@/lib/social-profile-discovery";

export type WebSearchHit = { title: string; url: string; description: string };

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

export async function braveWebSearch(query: string, count = 12): Promise<WebSearchHit[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY?.trim();
  if (!key) return [];
  try {
    const u = new URL("https://api.search.brave.com/res/v1/web/search");
    u.searchParams.set("q", query);
    u.searchParams.set("count", String(count));
    const res = await fetch(u.toString(), {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": key,
      },
    });
    if (!res.ok) {
      console.warn("[social-discovery] Brave search HTTP", res.status);
      return [];
    }
    const data = (await res.json()) as {
      web?: { results?: { title?: string; url?: string; description?: string }[] };
    };
    const rows = data.web?.results ?? [];
    return rows
      .map((r) => ({
        title: String(r.title ?? "").trim(),
        url: String(r.url ?? "").trim(),
        description: String(r.description ?? "").trim(),
      }))
      .filter((r) => r.url.startsWith("http"));
  } catch (e) {
    console.warn("[social-discovery] Brave search error", e);
    return [];
  }
}

function tokenOverlapScore(text: string, needles: string[]): number {
  const t = text.toLowerCase();
  let n = 0;
  for (const needle of needles) {
    const w = needle.toLowerCase().trim();
    if (w.length < 2) continue;
    if (t.includes(w)) n++;
  }
  return n;
}

function heuristicConfidence(contact: CrmContact, hit: WebSearchHit, platform: SocialPlatform): number {
  const parts = [
    contact.name,
    contact.firstName ?? "",
    contact.lastName ?? "",
    contact.company ?? "",
    contact.jobTitle ?? "",
  ].filter(Boolean) as string[];
  const blob = `${hit.title} ${hit.description} ${hit.url}`;
  const overlap = tokenOverlapScore(blob, parts);
  let score = 35 + Math.min(40, overlap * 12);
  if (platform === "linkedin") score += 8;
  if (contact.company && blob.toLowerCase().includes(contact.company.toLowerCase())) score += 12;
  return Math.min(96, Math.round(score));
}

export interface DiscoveryCandidate {
  platform: SocialPlatform;
  profileUrl: string;
  displayName: string;
  snippet: string;
  confidence: number;
  matchReason: string;
  discoverySource: "brave_web" | "openai_ranked";
}

function hitsToCandidates(contact: CrmContact, hits: WebSearchHit[]): DiscoveryCandidate[] {
  const seen = new Set<string>();
  const out: DiscoveryCandidate[] = [];
  for (const hit of hits) {
    const normalized = normalizeSocialProfileUrl(hit.url);
    if (!normalized) continue;
    try {
      const path = new URL(normalized).pathname.toLowerCase();
      if (normalized.includes("linkedin.com") && path.startsWith("/company/")) continue;
    } catch {
      /* skip */
    }
    const platform = detectSocialPlatformFromUrl(normalized);
    if (!platform) continue;
    const key = `${platform}:${normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const confidence = heuristicConfidence(contact, hit, platform);
    out.push({
      platform,
      profileUrl: normalized,
      displayName: hit.title.slice(0, 200) || contact.name,
      snippet: (hit.description || hit.title).slice(0, 500),
      confidence,
      matchReason: "Matched public search result to a known social profile URL pattern.",
      discoverySource: "brave_web",
    });
  }
  out.sort((a, b) => b.confidence - a.confidence);
  return out.slice(0, 12);
}

async function rankWithOpenAI(contact: CrmContact, candidates: DiscoveryCandidate[]): Promise<DiscoveryCandidate[]> {
  const client = getOpenAI();
  if (!client || candidates.length === 0) return candidates;

  const payload = candidates.map((c) => ({
    platform: c.platform,
    profileUrl: c.profileUrl,
    displayName: c.displayName,
    snippet: c.snippet,
    confidence: c.confidence,
  }));

  try {
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_SOCIAL_RANK_MODEL?.trim() || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You refine social profile candidates for a CRM contact. Input is ONLY URLs/snippets from web search — do not invent URLs.
Return JSON: { "ranked": [ { "profileUrl": string (must match input), "confidence": number 0-100, "matchReason": string } ] }
Reorder by likelihood the profile belongs to the contact. Lower confidence if name is common or company is missing from snippet.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            contact: {
              name: contact.name,
              email: contact.email,
              company: contact.company,
              jobTitle: contact.jobTitle,
            },
            candidates: payload,
          }),
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });
    const text = res.choices[0]?.message?.content;
    if (!text) return candidates;
    const parsed = JSON.parse(text) as {
      ranked?: { profileUrl: string; confidence: number; matchReason: string }[];
    };
    const ranked = parsed.ranked ?? [];
    const byUrl = new Map(candidates.map((c) => [c.profileUrl, c]));
    const merged: DiscoveryCandidate[] = [];
    for (const r of ranked) {
      const base = byUrl.get(r.profileUrl);
      if (!base) continue;
      merged.push({
        ...base,
        confidence: Math.max(0, Math.min(100, Math.round(r.confidence))),
        matchReason: r.matchReason || base.matchReason,
        discoverySource: "openai_ranked",
      });
    }
    for (const c of candidates) {
      if (!merged.find((m) => m.profileUrl === c.profileUrl)) merged.push(c);
    }
    merged.sort((a, b) => b.confidence - a.confidence);
    return merged.slice(0, 12);
  } catch (e) {
    console.warn("[social-discovery] OpenAI rank skipped", e);
    return candidates;
  }
}

function buildQueries(contact: CrmContact): string[] {
  const name = contact.name.trim();
  const company = contact.company?.trim();
  const role = contact.jobTitle?.trim();
  const q: string[] = [];
  if (company) q.push(`${name} ${company} linkedin`);
  q.push(`${name} linkedin`);
  if (company && role) q.push(`${name} ${role} ${company} site:linkedin.com/in`);
  q.push(`${name} twitter OR x.com`);
  if (company) q.push(`${name} ${company} site:github.com`);
  return [...new Set(q)].slice(0, 5);
}

export interface SocialDiscoveryRunResult {
  runId: string;
  usedBrave: boolean;
  usedOpenAI: boolean;
  suggestions: Omit<InsertCrmContactSocialSuggestion, "contactId" | "createdAt">[];
  manualSearchLinks: { label: string; url: string }[];
}

export async function runSocialProfileDiscovery(contact: CrmContact): Promise<SocialDiscoveryRunResult> {
  const runId = randomUUID();
  const manualSearchLinks = buildManualSocialSearchLinks({
    name: contact.name,
    company: contact.company,
    jobTitle: contact.jobTitle,
  });

  const queries = buildQueries(contact);
  let hits: WebSearchHit[] = [];
  let usedBrave = false;
  if (process.env.BRAVE_SEARCH_API_KEY?.trim()) {
    usedBrave = true;
    for (const q of queries) {
      hits.push(...(await braveWebSearch(q, 10)));
    }
  }
  const hitByUrl = new Map<string, WebSearchHit>();
  for (const h of hits) {
    const n = normalizeSocialProfileUrl(h.url);
    if (n) hitByUrl.set(n, { ...h, url: n });
  }
  hits = [...hitByUrl.values()];

  let candidates = hitsToCandidates(contact, hits);
  const preOpenAi = candidates.length;
  candidates = await rankWithOpenAI(contact, candidates);
  const usedOpenAI = preOpenAi > 0 && getOpenAI() != null && candidates.some((c) => c.discoverySource === "openai_ranked");

  const suggestions: Omit<InsertCrmContactSocialSuggestion, "contactId" | "createdAt">[] = candidates.map((c) => ({
    platform: c.platform,
    profileUrl: c.profileUrl,
    displayName: c.displayName,
    snippet: c.snippet,
    confidence: c.confidence,
    matchReason: c.matchReason,
    discoverySource: c.discoverySource,
    status: "suggested",
    discoveryRunId: runId,
    rawMetadata: {},
  }));

  return { runId, usedBrave, usedOpenAI, suggestions, manualSearchLinks };
}
