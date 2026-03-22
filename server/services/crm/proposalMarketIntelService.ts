/**
 * Proposal prep — live web context (Brave) + grounded AI synthesis for pricing / market signals.
 * Not financial advice; sources are third-party snippets only.
 */

import OpenAI from "openai";
import type { CrmContact, CrmProposalPrepWorkspace } from "@shared/crmSchema";
import type { ProposalPrepMarketIntelMeta, ProposalPrepMarketIntelSource } from "@shared/crmSchema";
import { braveWebSearch, type WebSearchHit } from "@server/services/crm/socialProfileDiscoveryService";

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

function stripJsonFence(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return t;
}

function buildSearchQueries(workspace: CrmProposalPrepWorkspace, contact: CrmContact | null | undefined): string[] {
  const offer = (workspace.offerDirection ?? "").trim();
  const scope = (workspace.scopeSummary ?? "").trim().slice(0, 120);
  const deliver = (workspace.deliverablesDraft ?? "").trim().slice(0, 120);
  const company = (contact?.company ?? "").trim().slice(0, 80);
  const year = new Date().getFullYear();

  const blob = [offer, scope, deliver].filter(Boolean).join(" ").slice(0, 280);

  const queries: string[] = [
    blob ? `${blob} pricing cost proposal services` : `${offer || "B2B professional services"} pricing benchmark`,
    `${offer || "digital agency"} project pricing range ${year}`,
    company ? `${company} industry ${offer || "software"} vendor pricing comparison` : `${offer || "custom development"} average project fee`,
  ];

  return [...new Set(queries.map((q) => q.replace(/\s+/g, " ").trim()).filter((q) => q.length > 8))].slice(0, 4);
}

function dedupeHits(hits: WebSearchHit[]): WebSearchHit[] {
  const seen = new Set<string>();
  const out: WebSearchHit[] = [];
  for (const h of hits) {
    const u = h.url.split("#")[0];
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(h);
  }
  return out;
}

export type ProposalMarketIntelResult =
  | {
      ok: true;
      summaryMarkdown: string;
      sources: ProposalPrepMarketIntelSource[];
      meta: ProposalPrepMarketIntelMeta;
    }
  | { ok: false; error: string };

/**
 * Fetches fresh web results and asks the model to compare only to provided snippets.
 */
export async function runProposalMarketIntel(input: {
  workspace: CrmProposalPrepWorkspace;
  contact?: CrmContact | null;
}): Promise<ProposalMarketIntelResult> {
  const braveConfigured = !!process.env.BRAVE_SEARCH_API_KEY?.trim();
  const queriesUsed = buildSearchQueries(input.workspace, input.contact);

  const allHits: WebSearchHit[] = [];
  if (braveConfigured) {
    for (const q of queriesUsed) {
      allHits.push(...(await braveWebSearch(q, 8)));
    }
  }
  const unique = dedupeHits(allHits).slice(0, 18);

  const sources: ProposalPrepMarketIntelSource[] = unique.map((h) => ({
    title: h.title,
    url: h.url,
    snippet: h.description,
  }));

  const client = getOpenAI();
  const model = process.env.OPENAI_PROPOSAL_MARKET_MODEL?.trim() || "gpt-4o-mini";
  const generatedAt = new Date().toISOString();

  const metaBase: ProposalPrepMarketIntelMeta = {
    generatedAt,
    queriesUsed,
    model: client ? model : undefined,
    braveConfigured,
    noLiveSources: sources.length === 0,
  };

  if (!client) {
    if (sources.length === 0) {
      return {
        ok: false,
        error:
          "Configure OPENAI_API_KEY for market analysis. Optionally add BRAVE_SEARCH_API_KEY for live web grounding.",
      };
    }
    const lines = sources.map((s, i) => `${i + 1}. [${s.title}](${s.url}) — ${s.snippet}`);
    return {
      ok: true,
      summaryMarkdown:
        `## Live search results (no AI synthesis)\n\n` +
        `OpenAI is not configured. Below are raw search snippets — verify every claim before quoting to a prospect.\n\n` +
        lines.join("\n\n"),
      sources,
      meta: metaBase,
    };
  }

  const sourceBlock = sources
    .map((s, i) => `[#${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}`)
    .join("\n\n");

  const system = `You are a senior B2B sales strategist helping close deals accurately.

Rules (non-negotiable):
- Ground every factual claim in the SOURCES list below. Reference sources as [#n] where n is the bracket number.
- If pricing or benchmarks are NOT explicitly in a snippet, say they were not found in current results — do not invent numbers.
- Web results are a moment-in-time snapshot, not verified transactions. Always state uncertainty.
- Output valid JSON only with keys:
  - executiveSummary (string, markdown, 2–4 short paragraphs)
  - marketCondition (string, one paragraph: demand signals, competition, or "insufficient data in sources")
  - comparisonBullets (string array, 4–8 bullets comparing this opportunity to patterns in sources, each bullet cites [#n] where possible)
  - pricingSignals (string array, only quotes or ranges literally implied by snippets, each with [#n]; empty array if none)
  - closingPlaybook (string array, 4–6 actionable tactics tailored to this deal, honest about risks)
  - caveats (string array, must include limitations of web search and that this is not legal/financial advice)

Tone: confident but precise. No hallucinated statistics.`;

  const user =
    `OFFER CONTEXT (internal — may be incomplete):
Offer direction: ${input.workspace.offerDirection ?? "(not set)"}
Scope: ${input.workspace.scopeSummary ?? "(not set)"}
Deliverables: ${input.workspace.deliverablesDraft ?? "(not set)"}
Pricing notes: ${input.workspace.pricingNotes ?? "(not set)"}
Contact company: ${input.contact?.company ?? "(unknown)"}

SOURCES:
${sourceBlock || "(no web results — Brave search returned nothing or API key missing)"}` +
    (sources.length === 0 ?
      `

CRITICAL: There are zero web snippets. Do not fabricate benchmarks or cite [#n]. pricingSignals must be []. comparisonBullets must be empty or limited to process-only guidance. Explain that live market data was not retrieved (configure BRAVE_SEARCH_API_KEY and try again).`
    : "");

  try {
    const res = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user.slice(0, 95_000) },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(stripJsonFence(raw)) as Record<string, unknown>;
    const exec = typeof parsed.executiveSummary === "string" ? parsed.executiveSummary : "";
    const market = typeof parsed.marketCondition === "string" ? parsed.marketCondition : "";
    const bullets = Array.isArray(parsed.comparisonBullets) ? parsed.comparisonBullets.map(String) : [];
    const pricing = Array.isArray(parsed.pricingSignals) ? parsed.pricingSignals.map(String) : [];
    const closing = Array.isArray(parsed.closingPlaybook) ? parsed.closingPlaybook.map(String) : [];
    const caveats = Array.isArray(parsed.caveats) ? parsed.caveats.map(String) : [];

    const summaryMarkdown =
      `## Executive summary\n\n${exec}\n\n` +
      `## Market snapshot\n\n${market}\n\n` +
      `## Comparison to public signals\n\n` +
      (bullets.length ? bullets.map((b) => `- ${b}`).join("\n") : "- No structured comparison generated.") +
      `\n\n## Pricing signals (from sources only)\n\n` +
      (pricing.length ? pricing.map((p) => `- ${p}`).join("\n") : "- No explicit pricing figures in current search snippets.") +
      `\n\n## Closing playbook\n\n` +
      (closing.length ? closing.map((c) => `- ${c}`).join("\n") : "- (none)") +
      `\n\n## Caveats\n\n` +
      (caveats.length ? caveats.map((c) => `- ${c}`).join("\n") : "- Verify all claims independently.");

    return {
      ok: true,
      summaryMarkdown,
      sources,
      meta: metaBase,
    };
  } catch (e) {
    console.error("[proposalMarketIntel]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Market intel failed" };
  }
}
