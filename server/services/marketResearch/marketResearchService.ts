import { createHash } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@server/db";
import {
  marketResearchProjects,
  marketResearchRuns,
  marketResearchFindings,
  marketResearchScores,
  marketResearchRecommendations,
  marketResearchReports,
  marketResearchSourceConfigs,
  marketResearchManualEntries,
  marketResearchAuditLogs,
  type MarketResearchProjectRow,
  type MarketResearchScoreRow,
  type MarketResearchSourceConfigRow,
} from "@shared/schema";
import { logGosAccessEvent } from "@server/services/growthOsFoundationService";
import {
  MARKET_RESEARCH_SOURCE_KEYS,
  type MarketResearchSourceKey,
  MARKET_RESEARCH_SCORE_DIMENSIONS,
} from "@shared/marketResearchConstants";

type SourceSetupStatus = "configured" | "partial" | "not_configured";
type SourceExecutionStatus = "completed" | "skipped" | "error";

type SourceCatalogItem = {
  key: MarketResearchSourceKey;
  label: string;
  requirements: string[];
  setupSteps: string[];
  fallbackAvailable: boolean;
  supportsConnectionTest: boolean;
};

export const MARKET_RESEARCH_SOURCE_CATALOG: Record<MarketResearchSourceKey, SourceCatalogItem> = {
  google_trends: {
    key: "google_trends",
    label: "Google Trends",
    requirements: ["API access (optional)", "Trend dataset (CSV/manual paste fallback supported)"],
    setupSteps: [
      "If API credentials are unavailable, paste trend data in setup.",
      "Include keyword, trend direction, and optional timestamp/link for each row.",
      "Enable fallback mode for manual runs.",
    ],
    fallbackAvailable: true,
    supportsConnectionTest: true,
  },
  google_ads_keyword_planner: {
    key: "google_ads_keyword_planner",
    label: "Google Ads Keyword Planner",
    requirements: ["Google Ads API credentials (optional)", "Keyword ideas/history fallback dataset"],
    setupSteps: [
      "Provide keyword ideas with monthly searches and CPC ranges.",
      "If live API is not connected, maintain periodic manual exports.",
      "Mark setup as partial when only fallback data is present.",
    ],
    fallbackAvailable: true,
    supportsConnectionTest: true,
  },
  reddit: {
    key: "reddit",
    label: "Reddit",
    requirements: ["Reddit API credentials (optional)", "Subreddit/post captures for fallback"],
    setupSteps: [
      "Save subreddit + post snapshots in setup when API is unavailable.",
      "Capture title/body/URL so pain points are traceable.",
      "Use subreddits from intake for repeatable discovery queries.",
    ],
    fallbackAvailable: true,
    supportsConnectionTest: true,
  },
  meta_ads_manual: {
    key: "meta_ads_manual",
    label: "Meta Ad Research (manual)",
    requirements: ["Manual ad capture rows (advertiser/copy/CTA/funnel/page)"],
    setupSteps: [
      "Paste each ad observation as a structured row.",
      "Record CTA, funnel type, and landing page URL.",
      "Keep notes focused on actual observed creative claims.",
    ],
    fallbackAvailable: true,
    supportsConnectionTest: false,
  },
  competitor_website: {
    key: "competitor_website",
    label: "Competitor Website Analysis",
    requirements: ["Public competitor URLs or page text snapshots"],
    setupSteps: [
      "Provide public URLs and/or pasted page text snapshots.",
      "Store headline/offer/CTA/pricing/guarantee snippets for traceability.",
      "Use only publicly accessible pages and captured excerpts.",
    ],
    fallbackAvailable: true,
    supportsConnectionTest: true,
  },
  manual_input: {
    key: "manual_input",
    label: "Manual Research Input",
    requirements: ["Notes or text uploads with optional source links"],
    setupSteps: [
      "Use manual entries in each project for interviews/calls/desk research.",
      "Tag entries for pain points, objections, competitors, or channels.",
      "Keep references attached for every critical claim.",
    ],
    fallbackAvailable: true,
    supportsConnectionTest: false,
  },
};

type RuntimeFinding = {
  sourceKey: MarketResearchSourceKey;
  sourceLabel: string;
  query: string;
  content: string;
  referenceUrl?: string;
  capturedAt: Date;
  confidence: number;
  metadataJson: Record<string, unknown>;
};

type NormalizedFinding = {
  pains: string[];
  competitors: string[];
  offers: string[];
  objections: string[];
  pricingMentions: string[];
  ctas: string[];
  acquisitionSignals: string[];
  trendDirection?: string;
};

type SourceExecutionResult = {
  sourceKey: MarketResearchSourceKey;
  sourceLabel: string;
  status: SourceExecutionStatus;
  setupStatus: SourceSetupStatus;
  fallbackUsed: boolean;
  confidence: number;
  findings: RuntimeFinding[];
  metadata: Record<string, unknown>;
  errorMessage?: string;
};

type PreparedSourceConfig = {
  row: MarketResearchSourceConfigRow;
  catalog: SourceCatalogItem;
  setupStatus: SourceSetupStatus;
};

type DashboardProjectSummary = {
  id: number;
  name: string;
  niche: string;
  location: string;
  status: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  marketScore: number | null;
  confidenceScore: number | null;
};

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function compactText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}

function toKeywordList(value: string): string[] {
  return value
    .split(/[,\n]/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

function createFingerprint(input: {
  sourceKey: string;
  query: string;
  content: string;
  referenceUrl?: string;
}): string {
  const raw = `${input.sourceKey}::${input.query}::${input.content}::${input.referenceUrl ?? ""}`;
  return createHash("sha256").update(raw).digest("hex");
}

function buildSetupStatus(configJson: Record<string, unknown>, sourceKey: MarketResearchSourceKey): SourceSetupStatus {
  const hasManualRows = Array.isArray(configJson.manualRows) && configJson.manualRows.length > 0;
  const hasPastedText = typeof configJson.pastedText === "string" && configJson.pastedText.trim().length > 0;
  const hasApiEnabled = configJson.apiEnabled === true;

  if (sourceKey === "manual_input") return "configured";
  if (hasApiEnabled && (hasManualRows || hasPastedText)) return "configured";
  if (hasApiEnabled || hasManualRows || hasPastedText) return "partial";
  return "not_configured";
}

async function writeAuditLog(input: {
  projectId?: number | null;
  runId?: number | null;
  actorUserId?: number | null;
  action: string;
  detailsJson?: Record<string, unknown>;
}) {
  await db.insert(marketResearchAuditLogs).values({
    projectId: input.projectId ?? null,
    runId: input.runId ?? null,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    detailsJson: input.detailsJson ?? {},
  });
}

export async function ensureMarketResearchSourceConfigs(
  projectKey = "ascendra_main",
  actorUserId: number | null = null,
): Promise<PreparedSourceConfig[]> {
  const rows = await db
    .select()
    .from(marketResearchSourceConfigs)
    .where(eq(marketResearchSourceConfigs.projectKey, projectKey));
  const existing = new Map(rows.map((r) => [r.sourceKey, r]));

  for (const key of MARKET_RESEARCH_SOURCE_KEYS) {
    if (!existing.has(key)) {
      const catalog = MARKET_RESEARCH_SOURCE_CATALOG[key];
      const [created] = await db
        .insert(marketResearchSourceConfigs)
        .values({
          projectKey,
          sourceKey: key,
          enabled: key === "manual_input",
          setupStatus: key === "manual_input" ? "configured" : "not_configured",
          configJson: {},
          checklistJson: catalog.setupSteps,
          fallbackEnabled: true,
          updatedByUserId: actorUserId ?? undefined,
        })
        .returning();
      if (created) existing.set(key, created);
    }
  }

  const refreshed = await db
    .select()
    .from(marketResearchSourceConfigs)
    .where(eq(marketResearchSourceConfigs.projectKey, projectKey));

  return refreshed
    .filter((row): row is MarketResearchSourceConfigRow & { sourceKey: MarketResearchSourceKey } =>
      MARKET_RESEARCH_SOURCE_KEYS.includes(row.sourceKey as MarketResearchSourceKey),
    )
    .map((row) => {
      const sourceKey = row.sourceKey as MarketResearchSourceKey;
      const setupStatus = buildSetupStatus(
        (row.configJson as Record<string, unknown> | null) ?? {},
        sourceKey,
      );
      return {
        row,
        catalog: MARKET_RESEARCH_SOURCE_CATALOG[sourceKey],
        setupStatus,
      };
    });
}

export async function listMarketResearchSourceConfigs(projectKey = "ascendra_main") {
  const prepared = await ensureMarketResearchSourceConfigs(projectKey);
  return prepared.map((p) => ({
    ...p.row,
    setupStatus: p.setupStatus,
    requirements: p.catalog.requirements,
    setupSteps: p.catalog.setupSteps,
    supportsConnectionTest: p.catalog.supportsConnectionTest,
    fallbackAvailable: p.catalog.fallbackAvailable,
  }));
}

export async function updateMarketResearchSourceConfig(input: {
  projectKey?: string;
  sourceKey: MarketResearchSourceKey;
  enabled?: boolean;
  fallbackEnabled?: boolean;
  configJson?: Record<string, unknown>;
  setupStatus?: SourceSetupStatus;
  checklistJson?: string[];
  actorUserId: number | null;
}) {
  const projectKey = input.projectKey ?? "ascendra_main";
  const prepared = await ensureMarketResearchSourceConfigs(projectKey, input.actorUserId);
  const target = prepared.find((p) => p.row.sourceKey === input.sourceKey);
  if (!target) throw new Error("Source config not found");

  const nextConfig = input.configJson ?? ((target.row.configJson as Record<string, unknown> | null) ?? {});
  const computedStatus = input.setupStatus ?? buildSetupStatus(nextConfig, input.sourceKey);

  const [updated] = await db
    .update(marketResearchSourceConfigs)
    .set({
      enabled: input.enabled ?? target.row.enabled,
      fallbackEnabled: input.fallbackEnabled ?? target.row.fallbackEnabled,
      setupStatus: computedStatus,
      checklistJson: input.checklistJson ?? target.catalog.setupSteps,
      configJson: nextConfig,
      updatedByUserId: input.actorUserId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(marketResearchSourceConfigs.id, target.row.id))
    .returning();

  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "source_config_updated",
    detailsJson: {
      projectKey,
      sourceKey: input.sourceKey,
      enabled: updated?.enabled,
      setupStatus: updated?.setupStatus,
    },
  });

  return updated;
}

function parseRowsFromCsvLikeText(textValue: string): Array<Record<string, string>> {
  const lines = textValue
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((v) => v.trim().toLowerCase());
  if (header.length < 2) return [];

  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j += 1) {
      row[header[j] ?? `col_${j}`] = cols[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function normalizeRawRows(configJson: Record<string, unknown>): Array<Record<string, unknown>> {
  const manualRows = Array.isArray(configJson.manualRows)
    ? configJson.manualRows.filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    : [];
  const pastedRows =
    typeof configJson.pastedText === "string" ? parseRowsFromCsvLikeText(configJson.pastedText) : [];
  return [...manualRows, ...pastedRows];
}

function deriveSetupState(findingsCount: number, hadError: boolean, hasConfig: boolean): SourceSetupStatus {
  if (hadError) return hasConfig ? "partial" : "not_configured";
  if (findingsCount > 0) return "configured";
  return hasConfig ? "partial" : "not_configured";
}

function buildSourceFinding(sourceKey: MarketResearchSourceKey, input: Omit<RuntimeFinding, "sourceKey">): RuntimeFinding {
  return {
    sourceKey,
    ...input,
  };
}

function runGoogleTrendsAdapter(input: {
  project: MarketResearchProjectRow;
  config: PreparedSourceConfig;
}): SourceExecutionResult {
  const configJson = (input.config.row.configJson as Record<string, unknown> | null) ?? {};
  const rows = normalizeRawRows(configJson);
  const findings: RuntimeFinding[] = [];

  for (const row of rows) {
    const keyword = compactText(String(row.keyword ?? row.term ?? row.query ?? ""));
    const direction = compactText(String(row.direction ?? row.trend_direction ?? "unknown")).toLowerCase();
    const metric = compactText(String(row.value ?? row.score ?? ""));
    const link = compactText(String(row.link ?? row.url ?? ""));
    const observedAt = compactText(String(row.timestamp ?? row.observed_at ?? ""));
    if (!keyword) continue;
    findings.push(
      buildSourceFinding("google_trends", {
        sourceLabel: "Google Trends",
        query: keyword,
        content: metric
          ? `Trend signal for "${keyword}" is ${direction} (value: ${metric}).`
          : `Trend signal for "${keyword}" is ${direction}.`,
        referenceUrl: link || undefined,
        capturedAt: observedAt ? new Date(observedAt) : new Date(),
        confidence: 0.74,
        metadataJson: { direction, metric, observedAt },
      }),
    );
  }

  if (findings.length === 0) {
    return {
      sourceKey: "google_trends",
      sourceLabel: "Google Trends",
      status: "skipped",
      setupStatus: deriveSetupState(0, false, rows.length > 0),
      fallbackUsed: true,
      confidence: 0.2,
      findings: [],
      metadata: {
        reason: "No trend rows configured. Add manual rows or pasted CSV in source setup.",
        keywordSeedCount: input.project.keywords.length,
      },
    };
  }

  return {
    sourceKey: "google_trends",
    sourceLabel: "Google Trends",
    status: "completed",
    setupStatus: "configured",
    fallbackUsed: true,
    confidence: 0.74,
    findings,
    metadata: { rowsRead: rows.length, keywordSeedCount: input.project.keywords.length },
  };
}

function runGoogleAdsAdapter(input: {
  project: MarketResearchProjectRow;
  config: PreparedSourceConfig;
}): SourceExecutionResult {
  const configJson = (input.config.row.configJson as Record<string, unknown> | null) ?? {};
  const rows = normalizeRawRows(configJson);
  const findings: RuntimeFinding[] = [];

  for (const row of rows) {
    const keyword = compactText(String(row.keyword ?? row.term ?? ""));
    const monthly = compactText(String(row.monthly_searches ?? row.volume ?? ""));
    const cpcLow = compactText(String(row.cpc_low ?? row.min_cpc ?? ""));
    const cpcHigh = compactText(String(row.cpc_high ?? row.max_cpc ?? ""));
    const competition = compactText(String(row.competition ?? row.competition_index ?? ""));
    const link = compactText(String(row.link ?? row.url ?? ""));
    if (!keyword) continue;
    findings.push(
      buildSourceFinding("google_ads_keyword_planner", {
        sourceLabel: "Google Ads Keyword Planner",
        query: keyword,
        content: `Keyword "${keyword}" monthly=${monthly || "n/a"}, cpc_low=${cpcLow || "n/a"}, cpc_high=${cpcHigh || "n/a"}, competition=${competition || "n/a"}.`,
        referenceUrl: link || undefined,
        capturedAt: new Date(),
        confidence: 0.78,
        metadataJson: { monthly, cpcLow, cpcHigh, competition },
      }),
    );
  }

  if (findings.length === 0) {
    return {
      sourceKey: "google_ads_keyword_planner",
      sourceLabel: "Google Ads Keyword Planner",
      status: "skipped",
      setupStatus: deriveSetupState(0, false, rows.length > 0),
      fallbackUsed: true,
      confidence: 0.2,
      findings: [],
      metadata: {
        reason: "No keyword planner rows configured.",
        keywordSeedCount: input.project.keywords.length,
      },
    };
  }

  return {
    sourceKey: "google_ads_keyword_planner",
    sourceLabel: "Google Ads Keyword Planner",
    status: "completed",
    setupStatus: "configured",
    fallbackUsed: true,
    confidence: 0.78,
    findings,
    metadata: { rowsRead: rows.length },
  };
}

function runRedditAdapter(input: {
  project: MarketResearchProjectRow;
  config: PreparedSourceConfig;
}): SourceExecutionResult {
  const configJson = (input.config.row.configJson as Record<string, unknown> | null) ?? {};
  const rows = normalizeRawRows(configJson);
  const findings: RuntimeFinding[] = [];

  for (const row of rows) {
    const subreddit = compactText(String(row.subreddit ?? ""));
    const title = compactText(String(row.title ?? row.headline ?? ""));
    const body = compactText(String(row.body ?? row.content ?? ""));
    const upvotes = compactText(String(row.upvotes ?? ""));
    const comments = compactText(String(row.comments ?? ""));
    const url = compactText(String(row.url ?? row.link ?? ""));
    const query = subreddit || input.project.subreddits[0] || "reddit";
    const content = [title, body, upvotes ? `upvotes=${upvotes}` : "", comments ? `comments=${comments}` : ""]
      .filter(Boolean)
      .join(" · ");
    if (!content) continue;
    findings.push(
      buildSourceFinding("reddit", {
        sourceLabel: "Reddit",
        query,
        content,
        referenceUrl: url || undefined,
        capturedAt: new Date(),
        confidence: 0.72,
        metadataJson: { subreddit, upvotes, comments },
      }),
    );
  }

  if (findings.length === 0) {
    return {
      sourceKey: "reddit",
      sourceLabel: "Reddit",
      status: "skipped",
      setupStatus: deriveSetupState(0, false, rows.length > 0),
      fallbackUsed: true,
      confidence: 0.2,
      findings: [],
      metadata: {
        reason: "No Reddit rows configured.",
        subredditCount: input.project.subreddits.length,
      },
    };
  }

  return {
    sourceKey: "reddit",
    sourceLabel: "Reddit",
    status: "completed",
    setupStatus: "configured",
    fallbackUsed: true,
    confidence: 0.72,
    findings,
    metadata: { rowsRead: rows.length },
  };
}

function runMetaManualAdapter(input: { config: PreparedSourceConfig }): SourceExecutionResult {
  const configJson = (input.config.row.configJson as Record<string, unknown> | null) ?? {};
  const rows = normalizeRawRows(configJson);
  const findings: RuntimeFinding[] = [];

  for (const row of rows) {
    const advertiser = compactText(String(row.advertiser ?? row.brand ?? ""));
    const copy = compactText(String(row.copy ?? row.ad_copy ?? row.content ?? ""));
    const cta = compactText(String(row.cta ?? row.call_to_action ?? ""));
    const funnelType = compactText(String(row.funnel_type ?? row.funnel ?? ""));
    const landingPage = compactText(String(row.landing_page ?? row.url ?? ""));
    const notes = compactText(String(row.notes ?? ""));
    const content = [advertiser ? `Advertiser: ${advertiser}` : "", copy, cta ? `CTA: ${cta}` : "", funnelType ? `Funnel: ${funnelType}` : "", notes]
      .filter(Boolean)
      .join(" · ");
    if (!content) continue;
    findings.push(
      buildSourceFinding("meta_ads_manual", {
        sourceLabel: "Meta Ad Research",
        query: advertiser || "meta_ads_manual",
        content,
        referenceUrl: landingPage || undefined,
        capturedAt: new Date(),
        confidence: 0.68,
        metadataJson: { advertiser, cta, funnelType },
      }),
    );
  }

  if (findings.length === 0) {
    return {
      sourceKey: "meta_ads_manual",
      sourceLabel: "Meta Ad Research",
      status: "skipped",
      setupStatus: deriveSetupState(0, false, rows.length > 0),
      fallbackUsed: true,
      confidence: 0.2,
      findings: [],
      metadata: { reason: "No manual Meta ad captures configured." },
    };
  }

  return {
    sourceKey: "meta_ads_manual",
    sourceLabel: "Meta Ad Research",
    status: "completed",
    setupStatus: "configured",
    fallbackUsed: true,
    confidence: 0.68,
    findings,
    metadata: { rowsRead: rows.length },
  };
}

function extractSiteSignals(textBlob: string): {
  headlines: string[];
  offers: string[];
  ctas: string[];
  pricingMentions: string[];
  guarantees: string[];
} {
  const lines = textBlob
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const lowLines = lines.map((line) => line.toLowerCase());
  const headlines = lines.filter((line) => line.length > 0 && line.length < 120).slice(0, 6);
  const offers = lines.filter((line) => /offer|package|plan|free|trial|discount|bonus/i.test(line)).slice(0, 6);
  const ctas = lines
    .filter((line) => /book|call|contact|sign up|get started|learn more|start now|request/i.test(line))
    .slice(0, 8);
  const pricingMentions = lines.filter((line) => /\$|price|pricing|\/mo|per month|per year/i.test(line)).slice(0, 8);
  const guarantees = lowLines
    .map((line, index) => (line.includes("guarantee") || line.includes("warranty") ? lines[index] : ""))
    .filter(Boolean)
    .slice(0, 4);

  return { headlines, offers, ctas, pricingMentions, guarantees };
}

function runCompetitorWebsiteAdapter(input: {
  project: MarketResearchProjectRow;
  config: PreparedSourceConfig;
}): SourceExecutionResult {
  const configJson = (input.config.row.configJson as Record<string, unknown> | null) ?? {};
  const rows = normalizeRawRows(configJson);
  const findings: RuntimeFinding[] = [];

  for (const row of rows) {
    const url = compactText(String(row.url ?? row.link ?? ""));
    const competitor = compactText(String(row.competitor ?? row.name ?? ""));
    const textBlob = compactText(String(row.content ?? row.text ?? row.snapshot ?? ""));
    const merged = [competitor ? `Competitor: ${competitor}` : "", textBlob].filter(Boolean).join("\n");
    if (!merged) continue;
    const signals = extractSiteSignals(merged);
    const content = [
      signals.headlines[0] ? `Headline: ${signals.headlines[0]}` : "",
      signals.offers[0] ? `Offer: ${signals.offers[0]}` : "",
      signals.ctas[0] ? `CTA: ${signals.ctas[0]}` : "",
      signals.pricingMentions[0] ? `Pricing: ${signals.pricingMentions[0]}` : "",
      signals.guarantees[0] ? `Guarantee: ${signals.guarantees[0]}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    findings.push(
      buildSourceFinding("competitor_website", {
        sourceLabel: "Competitor Website Analysis",
        query: competitor || url || input.project.competitors[0] || "competitor",
        content: content || merged.slice(0, 500),
        referenceUrl: url || undefined,
        capturedAt: new Date(),
        confidence: 0.71,
        metadataJson: {
          competitor,
          ...signals,
        },
      }),
    );
  }

  if (findings.length === 0) {
    return {
      sourceKey: "competitor_website",
      sourceLabel: "Competitor Website Analysis",
      status: "skipped",
      setupStatus: deriveSetupState(0, false, rows.length > 0),
      fallbackUsed: true,
      confidence: 0.2,
      findings: [],
      metadata: {
        reason: "No competitor page snapshots configured.",
        competitorSeedCount: input.project.competitors.length,
      },
    };
  }

  return {
    sourceKey: "competitor_website",
    sourceLabel: "Competitor Website Analysis",
    status: "completed",
    setupStatus: "configured",
    fallbackUsed: true,
    confidence: 0.71,
    findings,
    metadata: { rowsRead: rows.length },
  };
}

function runManualInputAdapter(input: {
  project: MarketResearchProjectRow;
  manualEntries: Array<{
    id: number;
    content: string;
    tags: string[];
    referenceUrl: string | null;
    createdAt: Date;
  }>;
}): SourceExecutionResult {
  const findings: RuntimeFinding[] = [];

  for (const row of input.manualEntries) {
    if (!compactText(row.content)) continue;
    findings.push(
      buildSourceFinding("manual_input", {
        sourceLabel: "Manual Input",
        query: row.tags.join(", ") || "manual_entry",
        content: row.content,
        referenceUrl: row.referenceUrl ?? undefined,
        capturedAt: row.createdAt,
        confidence: 0.8,
        metadataJson: { manualEntryId: row.id, tags: row.tags },
      }),
    );
  }

  if (compactText(input.project.notes)) {
    findings.push(
      buildSourceFinding("manual_input", {
        sourceLabel: "Manual Input",
        query: "project_notes",
        content: input.project.notes ?? "",
        capturedAt: input.project.updatedAt ?? new Date(),
        confidence: 0.7,
        metadataJson: { from: "project_notes" },
      }),
    );
  }

  if (findings.length === 0) {
    return {
      sourceKey: "manual_input",
      sourceLabel: "Manual Input",
      status: "skipped",
      setupStatus: "partial",
      fallbackUsed: true,
      confidence: 0.2,
      findings: [],
      metadata: { reason: "No manual notes available for this project yet." },
    };
  }

  return {
    sourceKey: "manual_input",
    sourceLabel: "Manual Input",
    status: "completed",
    setupStatus: "configured",
    fallbackUsed: true,
    confidence: 0.8,
    findings,
    metadata: { manualEntryCount: input.manualEntries.length },
  };
}

function extractFragments(content: string, terms: string[], maxItems = 6): string[] {
  const segments = content
    .split(/[\n.!?]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const hits: string[] = [];
  for (const seg of segments) {
    const low = seg.toLowerCase();
    if (terms.some((term) => low.includes(term)) && !hits.includes(seg)) {
      hits.push(seg.slice(0, 260));
      if (hits.length >= maxItems) break;
    }
  }
  return hits;
}

function normalizeFinding(finding: RuntimeFinding, project: MarketResearchProjectRow): NormalizedFinding {
  const content = `${finding.query}\n${finding.content}`.toLowerCase();
  const painTerms = ["pain", "problem", "frustrat", "expensive", "cannot", "can't", "delay", "slow", "issue"];
  const objectionTerms = ["concern", "risk", "skeptic", "not sure", "too expensive", "hard to trust", "objection"];
  const offerTerms = ["offer", "package", "trial", "discount", "bonus", "guarantee", "plan"];
  const pricingTerms = ["$", "price", "pricing", "/mo", "per month", "per year", "cost"];
  const ctaTerms = ["book", "call", "contact", "sign up", "get started", "learn more", "request"];
  const channelTerms = ["seo", "ppc", "google ads", "facebook ads", "meta ads", "outbound", "cold email", "linkedin"];

  const pains = extractFragments(`${finding.query}. ${finding.content}`, painTerms, 4);
  const objections = extractFragments(`${finding.query}. ${finding.content}`, objectionTerms, 4);
  const offers = extractFragments(`${finding.query}. ${finding.content}`, offerTerms, 4);
  const pricingMentions = extractFragments(`${finding.query}. ${finding.content}`, pricingTerms, 4);
  const ctas = extractFragments(`${finding.query}. ${finding.content}`, ctaTerms, 4);
  const acquisitionSignals = extractFragments(`${finding.query}. ${finding.content}`, channelTerms, 5);

  const competitors: string[] = [];
  for (const name of project.competitors) {
    if (name && content.includes(name.toLowerCase())) {
      competitors.push(name);
    }
  }

  let trendDirection: string | undefined;
  const mdDirection = compactText(String((finding.metadataJson.direction as string | undefined) ?? ""));
  if (mdDirection) trendDirection = mdDirection;

  return {
    pains,
    competitors,
    offers,
    objections,
    pricingMentions,
    ctas,
    acquisitionSignals,
    trendDirection,
  };
}

function scoreFromEvidence(params: {
  label: string;
  evidenceIds: number[];
  confidenceAvg: number;
  base: number;
  perEvidence: number;
  bonus?: number;
}): { value: number; explanation: string; evidenceFindingIds: number[] } {
  if (params.evidenceIds.length === 0) {
    return {
      value: 0,
      explanation: `${params.label}: no supporting evidence collected in this run, score held at 0 until data exists.`,
      evidenceFindingIds: [],
    };
  }
  const value = clamp(
    0,
    100,
    Math.round(
      params.base +
        params.evidenceIds.length * params.perEvidence +
        params.confidenceAvg * 28 +
        (params.bonus ?? 0),
    ),
  );
  return {
    value,
    explanation: `${params.label} derived from ${params.evidenceIds.length} evidence item(s) with avg confidence ${(params.confidenceAvg * 100).toFixed(0)}%.`,
    evidenceFindingIds: params.evidenceIds,
  };
}

function confidenceLevelFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function decisionFromScores(params: { marketScore: number; confidenceScore: number }): "pursue" | "test" | "wait" | "avoid" {
  if (params.confidenceScore < 35) return "wait";
  if (params.marketScore >= 70) return "pursue";
  if (params.marketScore >= 50) return "test";
  if (params.marketScore >= 30) return "wait";
  return "avoid";
}

export async function createMarketResearchProject(input: {
  projectKey?: string;
  name: string;
  industry: string;
  niche: string;
  service: string;
  location: string;
  keywords: string[];
  competitors: string[];
  subreddits: string[];
  sourcesEnabled: MarketResearchSourceKey[];
  notes?: string;
  actorUserId: number | null;
}) {
  const projectKey = input.projectKey ?? "ascendra_main";
  await ensureMarketResearchSourceConfigs(projectKey, input.actorUserId);

  const [row] = await db
    .insert(marketResearchProjects)
    .values({
      projectKey,
      name: compactText(input.name),
      industry: compactText(input.industry),
      niche: compactText(input.niche),
      service: compactText(input.service),
      location: compactText(input.location),
      keywords: input.keywords,
      competitors: input.competitors,
      subreddits: input.subreddits,
      sourcesEnabled: input.sourcesEnabled,
      notes: compactText(input.notes),
      status: "active",
      createdByUserId: input.actorUserId ?? undefined,
      updatedByUserId: input.actorUserId ?? undefined,
    })
    .returning();
  if (!row) throw new Error("Failed to create project");

  await writeAuditLog({
    projectId: row.id,
    actorUserId: input.actorUserId,
    action: "project_created",
    detailsJson: {
      sourcesEnabled: input.sourcesEnabled,
      keywordCount: input.keywords.length,
      competitorCount: input.competitors.length,
    },
  });
  await logGosAccessEvent({
    actorUserId: input.actorUserId,
    action: "market_research_project_created",
    resourceType: "market_research_project",
    resourceId: String(row.id),
    visibilityContext: "internal_only",
  });

  return row;
}

export async function updateMarketResearchProject(input: {
  projectId: number;
  name?: string;
  industry?: string;
  niche?: string;
  service?: string;
  location?: string;
  keywords?: string[];
  competitors?: string[];
  subreddits?: string[];
  sourcesEnabled?: MarketResearchSourceKey[];
  notes?: string;
  status?: string;
  actorUserId: number | null;
}) {
  const [existing] = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.id, input.projectId))
    .limit(1);
  if (!existing) return null;

  const [row] = await db
    .update(marketResearchProjects)
    .set({
      name: input.name != null ? compactText(input.name) : existing.name,
      industry: input.industry != null ? compactText(input.industry) : existing.industry,
      niche: input.niche != null ? compactText(input.niche) : existing.niche,
      service: input.service != null ? compactText(input.service) : existing.service,
      location: input.location != null ? compactText(input.location) : existing.location,
      keywords: input.keywords ?? existing.keywords,
      competitors: input.competitors ?? existing.competitors,
      subreddits: input.subreddits ?? existing.subreddits,
      sourcesEnabled: input.sourcesEnabled ?? existing.sourcesEnabled,
      notes: input.notes != null ? compactText(input.notes) : existing.notes,
      status: input.status ?? existing.status,
      updatedByUserId: input.actorUserId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(marketResearchProjects.id, input.projectId))
    .returning();

  if (!row) return null;

  await writeAuditLog({
    projectId: input.projectId,
    actorUserId: input.actorUserId,
    action: "project_updated",
    detailsJson: {
      sourcesEnabled: row.sourcesEnabled,
      keywordCount: row.keywords.length,
    },
  });
  return row;
}

export async function addMarketResearchManualEntry(input: {
  projectId: number;
  runId?: number | null;
  entryType?: string;
  content: string;
  tags: string[];
  referenceUrl?: string;
  actorUserId: number | null;
}) {
  const [row] = await db
    .insert(marketResearchManualEntries)
    .values({
      projectId: input.projectId,
      runId: input.runId ?? undefined,
      entryType: compactText(input.entryType) || "note",
      content: compactText(input.content),
      tags: input.tags,
      referenceUrl: compactText(input.referenceUrl) || undefined,
      createdByUserId: input.actorUserId ?? undefined,
    })
    .returning();
  if (!row) throw new Error("Failed to add manual entry");

  await writeAuditLog({
    projectId: input.projectId,
    runId: input.runId ?? null,
    actorUserId: input.actorUserId,
    action: "manual_entry_added",
    detailsJson: { entryId: row.id, tags: input.tags },
  });
  return row;
}

export async function listMarketResearchManualEntries(projectId: number, limit = 100) {
  return db
    .select()
    .from(marketResearchManualEntries)
    .where(eq(marketResearchManualEntries.projectId, projectId))
    .orderBy(desc(marketResearchManualEntries.createdAt))
    .limit(clamp(1, 300, limit));
}

function pickEvidenceIds(
  normalizedRows: Array<{ findingId: number; finding: RuntimeFinding; normalized: NormalizedFinding }>,
  predicate: (row: { finding: RuntimeFinding; normalized: NormalizedFinding }) => boolean,
): number[] {
  return normalizedRows.filter(predicate).map((row) => row.findingId);
}

export async function runMarketResearchProject(input: {
  projectId: number;
  actorUserId: number | null;
  triggerType?: string;
}) {
  const [project] = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.id, input.projectId))
    .limit(1);
  if (!project) throw new Error("Project not found");

  const sourceConfigs = await ensureMarketResearchSourceConfigs(project.projectKey, input.actorUserId);
  const enabledSourceSet = new Set(
    project.sourcesEnabled.filter((key): key is MarketResearchSourceKey =>
      MARKET_RESEARCH_SOURCE_KEYS.includes(key as MarketResearchSourceKey),
    ),
  );
  const activeConfigs = sourceConfigs.filter((cfg) => cfg.row.enabled && enabledSourceSet.has(cfg.row.sourceKey as MarketResearchSourceKey));
  if (activeConfigs.length === 0) {
    throw new Error("No enabled sources configured for this project.");
  }

  const [run] = await db
    .insert(marketResearchRuns)
    .values({
      projectId: project.id,
      status: "running",
      triggerType: compactText(input.triggerType) || "manual",
      triggeredByUserId: input.actorUserId ?? undefined,
      inputSnapshotJson: {
        name: project.name,
        industry: project.industry,
        niche: project.niche,
        service: project.service,
        location: project.location,
        keywords: project.keywords,
        competitors: project.competitors,
        subreddits: project.subreddits,
        sourcesEnabled: project.sourcesEnabled,
      },
      sourceExecutionJson: {},
    })
    .returning();
  if (!run) throw new Error("Failed to create run");

  await writeAuditLog({
    projectId: project.id,
    runId: run.id,
    actorUserId: input.actorUserId,
    action: "run_started",
    detailsJson: { sourceKeys: activeConfigs.map((cfg) => cfg.row.sourceKey) },
  });

  try {
    const manualRows = await db
      .select({
        id: marketResearchManualEntries.id,
        content: marketResearchManualEntries.content,
        tags: marketResearchManualEntries.tags,
        referenceUrl: marketResearchManualEntries.referenceUrl,
        createdAt: marketResearchManualEntries.createdAt,
      })
      .from(marketResearchManualEntries)
      .where(eq(marketResearchManualEntries.projectId, project.id))
      .orderBy(desc(marketResearchManualEntries.createdAt))
      .limit(200);

    const sourceExecutions: SourceExecutionResult[] = [];
    for (const config of activeConfigs) {
      const sourceKey = config.row.sourceKey as MarketResearchSourceKey;
      try {
        let result: SourceExecutionResult;
        if (sourceKey === "google_trends") {
          result = runGoogleTrendsAdapter({ project, config });
        } else if (sourceKey === "google_ads_keyword_planner") {
          result = runGoogleAdsAdapter({ project, config });
        } else if (sourceKey === "reddit") {
          result = runRedditAdapter({ project, config });
        } else if (sourceKey === "meta_ads_manual") {
          result = runMetaManualAdapter({ config });
        } else if (sourceKey === "competitor_website") {
          result = runCompetitorWebsiteAdapter({ project, config });
        } else {
          result = runManualInputAdapter({ project, manualEntries: manualRows });
        }
        sourceExecutions.push(result);
      } catch (error) {
        sourceExecutions.push({
          sourceKey,
          sourceLabel: MARKET_RESEARCH_SOURCE_CATALOG[sourceKey].label,
          status: "error",
          setupStatus: config.setupStatus,
          fallbackUsed: true,
          confidence: 0.1,
          findings: [],
          metadata: {},
          errorMessage: error instanceof Error ? error.message : "Unknown source error",
        });
      }
    }

    const executionJson: Record<string, unknown> = {};
    for (const ex of sourceExecutions) {
      executionJson[ex.sourceKey] = {
        status: ex.status,
        setupStatus: ex.setupStatus,
        fallbackUsed: ex.fallbackUsed,
        confidence: ex.confidence,
        findingsCount: ex.findings.length,
        metadata: ex.metadata,
        errorMessage: ex.errorMessage ?? null,
      };
    }

    const allFindings = sourceExecutions.flatMap((ex) => ex.findings);
    const dedupMap = new Map<string, RuntimeFinding>();
    for (const finding of allFindings) {
      const key = createFingerprint({
        sourceKey: finding.sourceKey,
        query: finding.query,
        content: finding.content,
        referenceUrl: finding.referenceUrl,
      });
      if (!dedupMap.has(key)) dedupMap.set(key, finding);
    }
    const dedupFindings = [...dedupMap.entries()].map(([fingerprint, finding]) => ({ fingerprint, finding }));

    const normalizedRows: Array<{ findingId: number; finding: RuntimeFinding; normalized: NormalizedFinding }> = [];
    for (const row of dedupFindings) {
      const normalized = normalizeFinding(row.finding, project);
      const [inserted] = await db
        .insert(marketResearchFindings)
        .values({
          projectId: project.id,
          runId: run.id,
          sourceKey: row.finding.sourceKey,
          sourceLabel: row.finding.sourceLabel,
          query: row.finding.query,
          content: row.finding.content,
          referenceUrl: row.finding.referenceUrl,
          capturedAt: row.finding.capturedAt,
          confidence: row.finding.confidence,
          fingerprint: row.fingerprint,
          normalizedJson: normalized as unknown as Record<string, unknown>,
          metadataJson: row.finding.metadataJson,
        })
        .returning({ id: marketResearchFindings.id });
      if (inserted) {
        normalizedRows.push({ findingId: inserted.id, finding: row.finding, normalized });
      }
    }

    const confidenceAvg =
      normalizedRows.length > 0
        ? normalizedRows.reduce((sum, row) => sum + row.finding.confidence, 0) / normalizedRows.length
        : 0;

    const demandEvidence = pickEvidenceIds(
      normalizedRows,
      ({ finding, normalized }) =>
        finding.sourceKey === "google_trends" ||
        finding.sourceKey === "google_ads_keyword_planner" ||
        normalized.trendDirection === "up" ||
        normalized.trendDirection === "growing",
    );
    const painEvidence = pickEvidenceIds(normalizedRows, ({ normalized }) => normalized.pains.length > 0);
    const competitionEvidence = pickEvidenceIds(
      normalizedRows,
      ({ finding, normalized }) =>
        finding.sourceKey === "competitor_website" ||
        normalized.competitors.length > 0 ||
        finding.sourceKey === "meta_ads_manual",
    );
    const offerGapEvidence = pickEvidenceIds(
      normalizedRows,
      ({ normalized }) => normalized.objections.length > 0 || normalized.offers.length > 0,
    );
    const ppcEvidence = pickEvidenceIds(
      normalizedRows,
      ({ finding, normalized }) =>
        finding.sourceKey === "google_ads_keyword_planner" ||
        finding.sourceKey === "meta_ads_manual" ||
        normalized.acquisitionSignals.some((s) => /ppc|google ads|meta ads|facebook ads/i.test(s)),
    );
    const seoEvidence = pickEvidenceIds(
      normalizedRows,
      ({ finding, normalized }) =>
        finding.sourceKey === "google_trends" ||
        finding.sourceKey === "reddit" ||
        normalized.acquisitionSignals.some((s) => /seo|organic|search/i.test(s)),
    );
    const outboundEvidence = pickEvidenceIds(
      normalizedRows,
      ({ normalized }) =>
        normalized.acquisitionSignals.some((s) => /outbound|cold email|linkedin|dm|prospect/i.test(s)),
    );
    const monetizationEvidence = pickEvidenceIds(
      normalizedRows,
      ({ normalized }) => normalized.pricingMentions.length > 0 || normalized.offers.length > 0,
    );
    const confidenceEvidence = normalizedRows.map((row) => row.findingId);

    const scoreRows = [
      {
        dimensionKey: "demand",
        ...scoreFromEvidence({
          label: "Demand",
          evidenceIds: demandEvidence,
          confidenceAvg,
          base: 20,
          perEvidence: 8,
        }),
      },
      {
        dimensionKey: "pain_severity",
        ...scoreFromEvidence({
          label: "Pain Severity",
          evidenceIds: painEvidence,
          confidenceAvg,
          base: 20,
          perEvidence: 9,
        }),
      },
      {
        dimensionKey: "competition",
        ...scoreFromEvidence({
          label: "Competition",
          evidenceIds: competitionEvidence,
          confidenceAvg,
          base: 25,
          perEvidence: 7,
        }),
      },
      {
        dimensionKey: "offer_gap",
        ...scoreFromEvidence({
          label: "Offer Gap",
          evidenceIds: offerGapEvidence,
          confidenceAvg,
          base: 15,
          perEvidence: 9,
        }),
      },
      {
        dimensionKey: "ppc_viability",
        ...scoreFromEvidence({
          label: "PPC Viability",
          evidenceIds: ppcEvidence,
          confidenceAvg,
          base: 15,
          perEvidence: 8,
        }),
      },
      {
        dimensionKey: "seo_opportunity",
        ...scoreFromEvidence({
          label: "SEO Opportunity",
          evidenceIds: seoEvidence,
          confidenceAvg,
          base: 15,
          perEvidence: 8,
        }),
      },
      {
        dimensionKey: "outbound_potential",
        ...scoreFromEvidence({
          label: "Outbound Potential",
          evidenceIds: outboundEvidence,
          confidenceAvg,
          base: 12,
          perEvidence: 9,
        }),
      },
      {
        dimensionKey: "monetization",
        ...scoreFromEvidence({
          label: "Monetization",
          evidenceIds: monetizationEvidence,
          confidenceAvg,
          base: 18,
          perEvidence: 8,
        }),
      },
      {
        dimensionKey: "confidence_score",
        ...scoreFromEvidence({
          label: "Confidence",
          evidenceIds: confidenceEvidence,
          confidenceAvg,
          base: 20,
          perEvidence: 4,
          bonus: new Set(normalizedRows.map((row) => row.finding.sourceKey)).size * 6,
        }),
      },
    ];

    const insertedScores: MarketResearchScoreRow[] = [];
    for (const score of scoreRows) {
      const [inserted] = await db
        .insert(marketResearchScores)
        .values({
          projectId: project.id,
          runId: run.id,
          dimensionKey: score.dimensionKey,
          numericScore: score.value,
          explanation: score.explanation,
          evidenceFindingIds: score.evidenceFindingIds,
        })
        .returning();
      if (inserted) insertedScores.push(inserted);
    }

    const scoreByKey = new Map(insertedScores.map((row) => [row.dimensionKey, row.numericScore]));
    const demand = scoreByKey.get("demand") ?? 0;
    const painSeverity = scoreByKey.get("pain_severity") ?? 0;
    const competition = scoreByKey.get("competition") ?? 0;
    const offerGap = scoreByKey.get("offer_gap") ?? 0;
    const ppc = scoreByKey.get("ppc_viability") ?? 0;
    const seo = scoreByKey.get("seo_opportunity") ?? 0;
    const outbound = scoreByKey.get("outbound_potential") ?? 0;
    const monetization = scoreByKey.get("monetization") ?? 0;
    const confidenceScore = scoreByKey.get("confidence_score") ?? 0;

    const marketScore = clamp(
      0,
      100,
      Math.round(
        (demand + painSeverity + offerGap + ppc + seo + outbound + monetization + confidenceScore + (100 - competition)) /
          9,
      ),
    );

    const bestChannel =
      ppc >= seo && ppc >= outbound
        ? "PPC"
        : seo >= ppc && seo >= outbound
          ? "SEO"
          : "Outbound";

    const topPain = normalizedRows
      .flatMap((row) => row.normalized.pains)
      .find(Boolean);
    const offerAngle = topPain
      ? `Position around solving: "${topPain.slice(0, 120)}".`
      : "Clarify a narrow pain-led promise before scaling acquisition.";

    const nextActions: string[] = [];
    if (demandEvidence.length === 0) nextActions.push("Add trend and keyword planner exports in source setup.");
    if (competitionEvidence.length === 0)
      nextActions.push("Capture competitor page snapshots with headline/offer/pricing snippets.");
    if (painEvidence.length === 0) nextActions.push("Add Reddit/manual customer pain notes with source links.");
    if (nextActions.length === 0) {
      nextActions.push("Launch a small channel test tied to the highest scoring acquisition path.");
      nextActions.push("Document outcomes and rerun this project for comparison.");
    }

    const risks: string[] = [];
    if (confidenceScore < 40) risks.push("Low confidence: evidence coverage is too thin.");
    if (competition > 70) risks.push("High competitive pressure may increase CAC.");
    if (monetization < 40) risks.push("Weak pricing/offer evidence may reduce conversion quality.");
    if (risks.length === 0) risks.push("No immediate blockers found in current evidence set.");

    const recommendationEvidence = Array.from(
      new Set([
        ...ppcEvidence.slice(0, 6),
        ...seoEvidence.slice(0, 6),
        ...outboundEvidence.slice(0, 6),
        ...offerGapEvidence.slice(0, 6),
      ]),
    );

    const [recommendation] = await db
      .insert(marketResearchRecommendations)
      .values({
        projectId: project.id,
        runId: run.id,
        acquisitionChannel: bestChannel,
        offerAngle,
        contentStrategy:
          seo >= 50
            ? "Prioritize pain-led search content and comparison pages backed by captured evidence."
            : "Prioritize proof-heavy outbound content snippets from manual/reddit pain evidence.",
        funnelSuggestion:
          painSeverity >= 60
            ? "Use a direct-response funnel with clear CTA, proof, and objection handling."
            : "Use a diagnostic/value-first funnel before conversion asks.",
        risks,
        nextActions,
        reasoning: `Recommendation selected from channel scores (PPC ${ppc}, SEO ${seo}, Outbound ${outbound}) and evidence coverage.`,
        evidenceFindingIds: recommendationEvidence,
      })
      .returning();

    const confidenceLevel = confidenceLevelFromScore(confidenceScore);
    const decision = decisionFromScores({ marketScore, confidenceScore });

    const supportingEvidence = normalizedRows.slice(0, 40).map((row) => ({
      findingId: row.findingId,
      source: row.finding.sourceLabel,
      query: row.finding.query,
      content: row.finding.content,
      link: row.finding.referenceUrl ?? null,
      timestamp: row.finding.capturedAt.toISOString(),
      normalized: row.normalized,
    }));

    const reportPayload = {
      executiveSummary:
        decision === "pursue"
          ? "Evidence supports entering this market with controlled execution."
          : decision === "test"
            ? "Evidence suggests opportunity, but execution should begin with constrained tests."
            : decision === "wait"
              ? "Current evidence is inconclusive; gather stronger source data before committing."
              : "Current evidence indicates unfavorable conditions for near-term investment.",
      marketScore,
      confidenceLevel,
      demandSignals: supportingEvidence
        .filter((row) => demandEvidence.includes(row.findingId))
        .slice(0, 12),
      painPoints: supportingEvidence
        .filter((row) => painEvidence.includes(row.findingId))
        .slice(0, 12),
      competitorBreakdown: supportingEvidence
        .filter((row) => competitionEvidence.includes(row.findingId))
        .slice(0, 12),
      offerGaps: supportingEvidence
        .filter((row) => offerGapEvidence.includes(row.findingId))
        .slice(0, 12),
      acquisitionStrategy: {
        bestChannel,
        ppcViability: ppc,
        seoOpportunity: seo,
        outboundPotential: outbound,
      },
      recommendedOffer: recommendation?.offerAngle ?? offerAngle,
      risks,
      supportingEvidence,
      nextSteps: nextActions,
      decision,
    };

    const [report] = await db
      .insert(marketResearchReports)
      .values({
        projectId: project.id,
        runId: run.id,
        executiveSummary: reportPayload.executiveSummary,
        marketScore,
        confidenceLevel,
        decision,
        reportJson: reportPayload,
      })
      .returning();

    const [updatedRun] = await db
      .update(marketResearchRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        sourceExecutionJson: executionJson,
      })
      .where(eq(marketResearchRuns.id, run.id))
      .returning();

    await db
      .update(marketResearchProjects)
      .set({
        status: "active",
        lastRunAt: new Date(),
        updatedAt: new Date(),
        updatedByUserId: input.actorUserId ?? undefined,
      })
      .where(eq(marketResearchProjects.id, project.id));

    await writeAuditLog({
      projectId: project.id,
      runId: run.id,
      actorUserId: input.actorUserId,
      action: "run_completed",
      detailsJson: {
        findingsCount: normalizedRows.length,
        marketScore,
        confidenceScore,
        decision,
      },
    });
    await logGosAccessEvent({
      actorUserId: input.actorUserId,
      action: "market_research_run_completed",
      resourceType: "market_research_project",
      resourceId: String(project.id),
      visibilityContext: "internal_only",
      metadata: { runId: run.id, marketScore, confidenceScore, decision },
    });

    return {
      project,
      run: updatedRun ?? run,
      findingsCount: normalizedRows.length,
      sourceExecutions,
      scores: insertedScores,
      recommendation: recommendation ?? null,
      report: report ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(marketResearchRuns)
      .set({ status: "failed", errorMessage: message, completedAt: new Date() })
      .where(eq(marketResearchRuns.id, run.id));
    await writeAuditLog({
      projectId: project.id,
      runId: run.id,
      actorUserId: input.actorUserId,
      action: "run_failed",
      detailsJson: { error: message },
    });
    throw error;
  }
}

export async function getMarketResearchRunBundle(input: { projectId: number; runId: number }) {
  const [run] = await db
    .select()
    .from(marketResearchRuns)
    .where(and(eq(marketResearchRuns.id, input.runId), eq(marketResearchRuns.projectId, input.projectId)))
    .limit(1);
  if (!run) return null;

  const [project] = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.id, input.projectId))
    .limit(1);
  if (!project) return null;

  const findings = await db
    .select()
    .from(marketResearchFindings)
    .where(eq(marketResearchFindings.runId, run.id))
    .orderBy(desc(marketResearchFindings.createdAt))
    .limit(500);
  const scores = await db
    .select()
    .from(marketResearchScores)
    .where(eq(marketResearchScores.runId, run.id))
    .orderBy(desc(marketResearchScores.createdAt));
  const [recommendation] = await db
    .select()
    .from(marketResearchRecommendations)
    .where(eq(marketResearchRecommendations.runId, run.id))
    .limit(1);
  const [report] = await db
    .select()
    .from(marketResearchReports)
    .where(eq(marketResearchReports.runId, run.id))
    .limit(1);

  return {
    project,
    run,
    findings,
    scores,
    recommendation: recommendation ?? null,
    report: report ?? null,
  };
}

export async function getMarketResearchProjectDetail(projectId: number) {
  const [project] = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.id, projectId))
    .limit(1);
  if (!project) return null;

  const runs = await db
    .select()
    .from(marketResearchRuns)
    .where(eq(marketResearchRuns.projectId, projectId))
    .orderBy(desc(marketResearchRuns.createdAt))
    .limit(25);
  const runIds = runs.map((r) => r.id);

  const findings = runIds.length
    ? await db
        .select()
        .from(marketResearchFindings)
        .where(inArray(marketResearchFindings.runId, runIds))
        .orderBy(desc(marketResearchFindings.createdAt))
        .limit(400)
    : [];
  const scores = runIds.length
    ? await db
        .select()
        .from(marketResearchScores)
        .where(inArray(marketResearchScores.runId, runIds))
        .orderBy(desc(marketResearchScores.createdAt))
    : [];
  const recommendations = runIds.length
    ? await db
        .select()
        .from(marketResearchRecommendations)
        .where(inArray(marketResearchRecommendations.runId, runIds))
        .orderBy(desc(marketResearchRecommendations.createdAt))
    : [];
  const reports = runIds.length
    ? await db
        .select()
        .from(marketResearchReports)
        .where(inArray(marketResearchReports.runId, runIds))
        .orderBy(desc(marketResearchReports.createdAt))
    : [];
  const manualEntries = await listMarketResearchManualEntries(projectId, 120);

  const latestRun = runs[0] ?? null;
  const latestReport = latestRun ? reports.find((row) => row.runId === latestRun.id) ?? null : null;
  const latestScores = latestRun ? scores.filter((row) => row.runId === latestRun.id) : [];
  const latestRecommendation = latestRun
    ? recommendations.find((row) => row.runId === latestRun.id) ?? null
    : null;
  const latestFindings = latestRun ? findings.filter((row) => row.runId === latestRun.id).slice(0, 120) : [];

  return {
    project,
    runs,
    reports,
    scores,
    recommendations,
    findings,
    manualEntries,
    latest: {
      run: latestRun,
      report: latestReport,
      scores: latestScores,
      recommendation: latestRecommendation,
      findings: latestFindings,
    },
  };
}

export async function compareMarketResearchRuns(input: { projectId: number; runIds?: number[] }) {
  const candidateRuns =
    input.runIds && input.runIds.length >= 2
      ? await db
          .select()
          .from(marketResearchRuns)
          .where(
            and(
              eq(marketResearchRuns.projectId, input.projectId),
              inArray(marketResearchRuns.id, input.runIds.slice(0, 2)),
            ),
          )
          .orderBy(desc(marketResearchRuns.createdAt))
      : await db
          .select()
          .from(marketResearchRuns)
          .where(and(eq(marketResearchRuns.projectId, input.projectId), eq(marketResearchRuns.status, "completed")))
          .orderBy(desc(marketResearchRuns.createdAt))
          .limit(2);

  if (candidateRuns.length < 2) {
    return null;
  }

  const [currentRun, previousRun] = candidateRuns;
  const scores = await db
    .select()
    .from(marketResearchScores)
    .where(inArray(marketResearchScores.runId, [currentRun.id, previousRun.id]));

  const reports = await db
    .select()
    .from(marketResearchReports)
    .where(inArray(marketResearchReports.runId, [currentRun.id, previousRun.id]));

  const currentScoreMap = new Map(
    scores.filter((row) => row.runId === currentRun.id).map((row) => [row.dimensionKey, row]),
  );
  const previousScoreMap = new Map(
    scores.filter((row) => row.runId === previousRun.id).map((row) => [row.dimensionKey, row]),
  );

  const dimensions = [
    "demand",
    "pain_severity",
    "competition",
    "offer_gap",
    "ppc_viability",
    "seo_opportunity",
    "outbound_potential",
    "monetization",
    "confidence_score",
  ];

  const deltas = dimensions.map((dimensionKey) => {
    const current = currentScoreMap.get(dimensionKey)?.numericScore ?? 0;
    const previous = previousScoreMap.get(dimensionKey)?.numericScore ?? 0;
    return {
      dimensionKey,
      current,
      previous,
      delta: current - previous,
    };
  });

  const currentReport = reports.find((row) => row.runId === currentRun.id) ?? null;
  const previousReport = reports.find((row) => row.runId === previousRun.id) ?? null;

  return {
    currentRun,
    previousRun,
    currentReport,
    previousReport,
    marketScoreDelta: (currentReport?.marketScore ?? 0) - (previousReport?.marketScore ?? 0),
    deltas,
  };
}

export async function getMarketResearchDashboard(projectKey = "ascendra_main"): Promise<{
  projects: DashboardProjectSummary[];
  sourceStatuses: Array<{
    sourceKey: string;
    label: string;
    enabled: boolean;
    setupStatus: string;
    fallbackEnabled: boolean;
    lastTestStatus: string | null;
    lastTestMessage: string | null;
  }>;
  recentFindings: Array<{
    id: number;
    projectId: number;
    sourceLabel: string;
    query: string | null;
    content: string;
    referenceUrl: string | null;
    createdAt: Date;
  }>;
  savedReports: Array<{
    id: number;
    projectId: number;
    runId: number;
    projectName: string;
    marketScore: number;
    confidenceLevel: string;
    decision: string;
    createdAt: Date;
  }>;
}> {
  const sourceStatuses = await listMarketResearchSourceConfigs(projectKey);
  const projects = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.projectKey, projectKey))
    .orderBy(desc(marketResearchProjects.updatedAt))
    .limit(80);

  const projectSummaries: DashboardProjectSummary[] = [];
  for (const project of projects) {
    const [run] = await db
      .select()
      .from(marketResearchRuns)
      .where(eq(marketResearchRuns.projectId, project.id))
      .orderBy(desc(marketResearchRuns.createdAt))
      .limit(1);
    const [report] = run
      ? await db
          .select()
          .from(marketResearchReports)
          .where(eq(marketResearchReports.runId, run.id))
          .limit(1)
      : [];
    const confidenceScore = run
      ? (
          await db
            .select()
            .from(marketResearchScores)
            .where(
              and(
                eq(marketResearchScores.runId, run.id),
                eq(marketResearchScores.dimensionKey, "confidence_score"),
              ),
            )
            .limit(1)
        )[0]?.numericScore ?? null
      : null;

    projectSummaries.push({
      id: project.id,
      name: project.name,
      niche: project.niche,
      location: project.location,
      status: project.status,
      lastRunAt: run?.createdAt ? run.createdAt.toISOString() : null,
      lastRunStatus: run?.status ?? null,
      marketScore: report?.marketScore ?? null,
      confidenceScore,
    });
  }

  const recentFindings = await db
    .select({
      id: marketResearchFindings.id,
      projectId: marketResearchFindings.projectId,
      sourceLabel: marketResearchFindings.sourceLabel,
      query: marketResearchFindings.query,
      content: marketResearchFindings.content,
      referenceUrl: marketResearchFindings.referenceUrl,
      createdAt: marketResearchFindings.createdAt,
    })
    .from(marketResearchFindings)
    .orderBy(desc(marketResearchFindings.createdAt))
    .limit(40);

  const savedReports = await db
    .select({
      id: marketResearchReports.id,
      projectId: marketResearchReports.projectId,
      runId: marketResearchReports.runId,
      projectName: marketResearchProjects.name,
      marketScore: marketResearchReports.marketScore,
      confidenceLevel: marketResearchReports.confidenceLevel,
      decision: marketResearchReports.decision,
      createdAt: marketResearchReports.createdAt,
    })
    .from(marketResearchReports)
    .innerJoin(marketResearchProjects, eq(marketResearchProjects.id, marketResearchReports.projectId))
    .orderBy(desc(marketResearchReports.createdAt))
    .limit(40);

  return {
    projects: projectSummaries,
    sourceStatuses: sourceStatuses.map((source) => ({
      sourceKey: source.sourceKey,
      label: MARKET_RESEARCH_SOURCE_CATALOG[source.sourceKey as MarketResearchSourceKey]?.label ?? source.sourceKey,
      enabled: source.enabled,
      setupStatus: source.setupStatus,
      fallbackEnabled: source.fallbackEnabled,
      lastTestStatus: source.lastTestStatus ?? null,
      lastTestMessage: source.lastTestMessage ?? null,
    })),
    recentFindings,
    savedReports,
  };
}

export async function testMarketResearchSourceConnection(input: {
  projectKey?: string;
  sourceKey: MarketResearchSourceKey;
  actorUserId: number | null;
}) {
  const projectKey = input.projectKey ?? "ascendra_main";
  const prepared = await ensureMarketResearchSourceConfigs(projectKey, input.actorUserId);
  const source = prepared.find((s) => s.row.sourceKey === input.sourceKey);
  if (!source) throw new Error("Source config not found");

  const configJson = (source.row.configJson as Record<string, unknown> | null) ?? {};
  const hasManualRows = normalizeRawRows(configJson).length > 0;
  const hasApiEnabled = configJson.apiEnabled === true;
  const envSignals: Record<string, boolean> = {
    google_trends: Boolean(process.env.GOOGLE_API_KEY),
    google_ads_keyword_planner: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    reddit: Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
    competitor_website: true,
    meta_ads_manual: true,
    manual_input: true,
  };

  const envReady = envSignals[input.sourceKey] ?? false;
  const passed = hasManualRows || hasApiEnabled || envReady || input.sourceKey === "manual_input";
  const status = passed ? "ok" : "warning";
  const message = passed
    ? hasManualRows
      ? "Manual fallback dataset detected."
      : envReady
        ? "Environment appears configured."
        : "Setup marked ready."
    : "No API env signal or manual dataset found for this source.";

  const [updated] = await db
    .update(marketResearchSourceConfigs)
    .set({
      lastTestedAt: new Date(),
      lastTestStatus: status,
      lastTestMessage: message,
      setupStatus: buildSetupStatus(configJson, input.sourceKey),
      updatedByUserId: input.actorUserId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(marketResearchSourceConfigs.id, source.row.id))
    .returning();

  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "source_connection_tested",
    detailsJson: {
      projectKey,
      sourceKey: input.sourceKey,
      status,
      message,
    },
  });

  return {
    sourceKey: input.sourceKey,
    status,
    passed,
    message,
    setupStatus: updated?.setupStatus ?? source.setupStatus,
  };
}

export async function listMarketResearchProjects(input?: {
  projectKey?: string;
  limit?: number;
  search?: string;
}) {
  const projectKey = input?.projectKey ?? "ascendra_main";
  const limit = clamp(1, 200, input?.limit ?? 100);
  const search = compactText(input?.search).toLowerCase();

  const rows = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.projectKey, projectKey))
    .orderBy(desc(marketResearchProjects.updatedAt))
    .limit(limit);

  if (!search) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.industry,
      row.niche,
      row.service,
      row.location,
      row.keywords.join(" "),
      row.competitors.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

export async function getMarketResearchRunDetail(input: { projectId: number; runId: number }) {
  const [run] = await db
    .select()
    .from(marketResearchRuns)
    .where(
      and(
        eq(marketResearchRuns.id, input.runId),
        eq(marketResearchRuns.projectId, input.projectId),
      ),
    )
    .limit(1);
  if (!run) return null;

  const [report] = await db
    .select()
    .from(marketResearchReports)
    .where(eq(marketResearchReports.runId, run.id))
    .limit(1);
  const [recommendation] = await db
    .select()
    .from(marketResearchRecommendations)
    .where(eq(marketResearchRecommendations.runId, run.id))
    .limit(1);
  const scores = await db
    .select()
    .from(marketResearchScores)
    .where(eq(marketResearchScores.runId, run.id))
    .orderBy(marketResearchScores.dimensionKey);
  const findings = await db
    .select()
    .from(marketResearchFindings)
    .where(eq(marketResearchFindings.runId, run.id))
    .orderBy(desc(marketResearchFindings.createdAt))
    .limit(300);

  return { run, report: report ?? null, recommendation: recommendation ?? null, scores, findings };
}

export async function getMarketResearchReportById(reportId: number) {
  const [report] = await db
    .select()
    .from(marketResearchReports)
    .where(eq(marketResearchReports.id, reportId))
    .limit(1);
  if (!report) return null;
  const [project] = await db
    .select()
    .from(marketResearchProjects)
    .where(eq(marketResearchProjects.id, report.projectId))
    .limit(1);
  const runDetail = await getMarketResearchRunDetail({ projectId: report.projectId, runId: report.runId });
  if (!project || !runDetail) return null;
  return { project, ...runDetail };
}

