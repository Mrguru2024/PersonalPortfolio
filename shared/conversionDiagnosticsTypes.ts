/**
 * Ascendra Growth Intelligence — diagnostics payloads (admin operational vs client Conversion Diagnostics).
 * @see Docs/GROWTH-INTELLIGENCE-MODULE.md
 */

export type IntentBand = "low" | "warm" | "high" | "ready";

export interface IntentDistributionSlice {
  band: IntentBand;
  sessions: number;
  pct: number;
}

export interface AdminGrowthDiagnostics {
  periodDays: number;
  sinceIso: string;
  totals: {
    sessions: number;
    uniqueSessions: number;
    behaviorEvents: number;
    heatmapPoints: number;
    convertedSessions: number;
    replaySegments: number;
  };
  deviceSplit: { device: string; sessions: number }[];
  topPages: { page: string; sessions: number; events: number }[];
  eventTypes: { type: string; count: number }[];
  topFrictionPages: {
    page: string;
    rageClicks: number;
    deadClicks: number;
    dropOffRate: number | null;
    summary: string | null;
    createdAt: string;
  }[];
  surveyPulse: { surveyId: number; question: string; responses7d: number }[];
  intentDistribution: IntentDistributionSlice[];
  /** Heuristic summaries — not ML; safe to show operators. */
  aiOperatorHighlights: string[];
  experimentHooks: {
    message: string;
    adminExperimentsUrl: string;
  };
}

/** Single executive card on the client Conversion Diagnostics header row. */
export interface ClientExecutiveMetric {
  id: string;
  label: string;
  value: string;
  deltaLabel?: string;
  sublabel?: string;
}

export interface ClientFrictionPoint {
  title: string;
  explanation: string;
  priority: "high" | "medium" | "monitor";
  affectedArea: string;
  suggestedNext?: string;
}

export type ClientPageStatus = "strong" | "attention" | "dropoff" | "improving" | "stable";

export interface ClientPagePerformanceRow {
  path: string;
  visitors: number;
  engagementLabel: string;
  conversionsLabel: string;
  frictionLabel: string;
  status: ClientPageStatus;
}

export interface ClientSessionHighlight {
  summary: string;
  tags: string[];
}

export interface ClientRecommendedAction {
  title: string;
  why: string;
  affectedArea: string;
  expectedBenefit: string;
  priority: "high" | "medium" | "low";
  status: "recommended" | "planned" | "in_progress" | "completed";
}

export interface ClientTrendPoint {
  /** ISO date yyyy-mm-dd */
  date: string;
  sessions: number;
  interactions: number;
}

/**
 * Premium client-facing Conversion Diagnostics — narrative-first, CRM-linked behavior scope.
 * Raw replay queues and event payloads are never included.
 */
export interface ClientConversionDiagnostics {
  mode: "live" | "preview_empty";
  businessLabel: string;
  sinceIso: string;
  periodDays: number;
  lastUpdatedIso: string;
  headline: string;
  subhead: string;
  /** Shown under the title on the client dashboard (section K2). */
  clientSubtitle: string;
  snapshot: {
    sessions: number;
    pageViewsApprox: number;
    convertedSessions: number;
    highFrictionPages: number;
  };
  whatsWorking: string[];
  needsAttention: string[];
  recommendedFixes: string[];
  recentProgress: string[];
  trafficOverview: { label: string; value: string }[];
  topPages: { path: string; sessions: number }[];
  formAndCta: { label: string; detail: string }[];
  surveyThemes: string[];
  intentSummary: string;
  heatmapHint: string;
  privacyNote: string;
  /** K3 — executive summary row */
  executiveMetrics: ClientExecutiveMetric[];
  /** K4 — featured narrative blocks */
  conversionSnapshot: {
    working: string;
    attention: string;
    opportunity: string;
    movement: string;
  };
  /** K6 */
  behaviorHighlights: string[];
  /** K7 */
  pagePerformance: ClientPagePerformanceRow[];
  /** K9 */
  frictionPoints: ClientFrictionPoint[];
  /** K10 — plain-language only; no raw heatmap binary */
  heatmapHighlights: string[];
  /** K11 — curated stories, not raw replay */
  sessionHighlights: ClientSessionHighlight[];
  /** K12 */
  feedbackInsights: string[];
  /** K13 */
  recommendedActions: ClientRecommendedAction[];
  /** K15 */
  trends: ClientTrendPoint[];
  /** K5 — lightweight source split when utm/source_json exists */
  trafficSources: { label: string; sessions: number; note?: string }[];
  /** K8 — form/cta event rollups when instrumented */
  formFunnelHints: { label: string; detail: string }[];
}
