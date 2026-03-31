/**
 * Aggregates behavior_sessions, behavior_events, friction + surveys into
 * admin Growth Intelligence diagnostics and client Conversion Diagnostics.
 */
import { db } from "@server/db";
import { storage } from "@server/storage";
import {
  behaviorEvents,
  behaviorFrictionReports,
  behaviorHeatmapEvents,
  behaviorReplaySegments,
  behaviorSessions,
  behaviorSurveyResponses,
  behaviorSurveys,
} from "@shared/schema";
import type {
  AdminGrowthDiagnostics,
  ClientConversionDiagnostics,
  ClientFrictionPoint,
  ClientPagePerformanceRow,
  ClientRecommendedAction,
  ClientSessionHighlight,
  IntentBand,
} from "@shared/conversionDiagnosticsTypes";
import { buildClientPhase2Overlay } from "@server/services/growthEngine/clientPhase2Overlay";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, sql } from "drizzle-orm";

const INTENT_PAGE_HINTS = ["/pricing", "/book", "/schedule", "/contact", "/qualify", "/offer", "/strategy"];

function pageExpr() {
  return sql<string>`nullif(trim(both from coalesce(${behaviorEvents.metadata}->>'page', '')), '')`;
}

function normPagePath(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    if (s.startsWith("http")) return new URL(s).pathname || s;
  } catch {
    /* ignore */
  }
  return s.split("?")[0] ?? s;
}

function hintIntentFromPaths(pathSet: Set<string>): IntentBand {
  for (const p of pathSet) {
    const low = p.toLowerCase();
    if (INTENT_PAGE_HINTS.some((h) => low.includes(h))) return "ready";
  }
  return "warm";
}

function classifySessionIntent(args: {
  converted: boolean;
  eventCount: number;
  pathSet: Set<string>;
}): IntentBand {
  if (args.converted) return "ready";
  if (args.eventCount >= 40) return "high";
  const hint = hintIntentFromPaths(args.pathSet);
  if (hint === "ready") return "high";
  if (args.eventCount >= 15) return "warm";
  if (args.eventCount >= 5) return "warm";
  return "low";
}

export async function buildAdminGrowthDiagnostics(days: number): Promise<AdminGrowthDiagnostics> {
  const periodDays = Math.min(90, Math.max(1, Math.floor(days)));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const sessionWhere = and(gte(behaviorSessions.startTime, since), isNull(behaviorSessions.softDeletedAt));

  const [[sessionAgg], [eventAgg], [heatmapAgg], [replayAgg], [convertedAgg]] = await Promise.all([
    db.select({ c: count() }).from(behaviorSessions).where(sessionWhere),
    db.select({ c: count() }).from(behaviorEvents).where(gte(behaviorEvents.timestamp, since)),
    db.select({ c: count() }).from(behaviorHeatmapEvents).where(gte(behaviorHeatmapEvents.createdAt, since)),
    db.select({ c: count() }).from(behaviorReplaySegments).where(gte(behaviorReplaySegments.createdAt, since)),
    db
      .select({ c: count() })
      .from(behaviorSessions)
      .where(and(sessionWhere, eq(behaviorSessions.converted, true))),
  ]);

  const deviceRows = await db
    .select({
      device: sql<string>`coalesce(nullif(trim(${behaviorSessions.device}), ''), 'unknown')`,
      c: count(),
    })
    .from(behaviorSessions)
    .where(sessionWhere)
    .groupBy(behaviorSessions.device);

  const pex = pageExpr();
  const topPageRows = await db
    .select({
      page: pex,
      events: count(),
    })
    .from(behaviorEvents)
    .where(and(gte(behaviorEvents.timestamp, since), sql`${pex} is not null`))
    .groupBy(pex)
    .orderBy(desc(count()))
    .limit(20);

  const eventTypeRows = await db
    .select({
      type: behaviorEvents.type,
      c: count(),
    })
    .from(behaviorEvents)
    .where(gte(behaviorEvents.timestamp, since))
    .groupBy(behaviorEvents.type)
    .orderBy(desc(count()))
    .limit(30);

  const latestFriction = await db
    .select()
    .from(behaviorFrictionReports)
    .orderBy(desc(behaviorFrictionReports.createdAt))
    .limit(12);

  const surveyList = await db.select({ id: behaviorSurveys.id, question: behaviorSurveys.question }).from(behaviorSurveys);

  const surveyPulse = await Promise.all(
    surveyList.slice(0, 15).map(async (s) => {
      const [row] = await db
        .select({ c: count() })
        .from(behaviorSurveyResponses)
        .where(
          and(eq(behaviorSurveyResponses.surveyId, s.id), gte(behaviorSurveyResponses.createdAt, since)),
        );
      return { surveyId: s.id, question: s.question.slice(0, 160), responses7d: Number(row?.c ?? 0) };
    }),
  );

  const recentSessions = await db
    .select({
      id: behaviorSessions.id,
      sessionId: behaviorSessions.sessionId,
      converted: behaviorSessions.converted,
    })
    .from(behaviorSessions)
    .where(sessionWhere)
    .orderBy(desc(behaviorSessions.startTime))
    .limit(400);

  const sessionIds = recentSessions.map((s) => s.id);
  const intentBuckets: Record<IntentBand, number> = { low: 0, warm: 0, high: 0, ready: 0 };

  if (sessionIds.length > 0) {
    const evRows = await db
      .select({
        behaviorSessionId: behaviorEvents.behaviorSessionId,
        meta: behaviorEvents.metadata,
      })
      .from(behaviorEvents)
      .where(and(gte(behaviorEvents.timestamp, since), inArray(behaviorEvents.behaviorSessionId, sessionIds)));

    const bySess = new Map<number, { n: number; paths: Set<string> }>();
    for (const sid of sessionIds) {
      bySess.set(sid, { n: 0, paths: new Set() });
    }
    for (const r of evRows) {
      const bid = r.behaviorSessionId;
      if (bid == null) continue;
      const b = bySess.get(bid);
      if (!b) continue;
      b.n += 1;
      const m = r.meta as Record<string, unknown> | null;
      const page = typeof m?.page === "string" ? m.page : "";
      const url = typeof m?.url === "string" ? m.url : "";
      const p = normPagePath(page || url);
      if (p) b.paths.add(p);
    }

    for (const s of recentSessions) {
      const b = bySess.get(s.id) ?? { n: 0, paths: new Set<string>() };
      const band = classifySessionIntent({ converted: s.converted, eventCount: b.n, pathSet: b.paths });
      intentBuckets[band] += 1;
    }
  }

  const intentTotal = Object.values(intentBuckets).reduce((a, x) => a + x, 0) || 1;
  const intentDistribution = (["low", "warm", "high", "ready"] as const).map((band) => ({
    band,
    sessions: intentBuckets[band],
    pct: Math.round((intentBuckets[band] / intentTotal) * 1000) / 10,
  }));

  const sessionsN = Number(sessionAgg?.c ?? 0);
  const aiOperatorHighlights: string[] = [];
  if (latestFriction[0]) {
    aiOperatorHighlights.push(
      `Top friction signal: ${latestFriction[0]!.page} — ${latestFriction[0]!.summary ?? "review heatmap + replay queue."}`,
    );
  }
  if (topPageRows[0]?.page) {
    aiOperatorHighlights.push(
      `Highest interaction volume page: ${topPageRows[0]!.page} (${topPageRows[0]!.events} behavior events).`,
    );
  }
  const ctaRows = eventTypeRows.filter((r) => r.type === "cta_click" || r.type === "click");
  if (ctaRows.length > 0) {
    aiOperatorHighlights.push(
      `Click / CTA-related events in window: ${ctaRows.reduce((a, x) => a + Number(x.c), 0)} — compare to converted sessions (${Number(convertedAgg?.c ?? 0)}).`,
    );
  }
  if (intentBuckets.ready + intentBuckets.high > 0 && sessionsN > 0) {
    aiOperatorHighlights.push(
      `${intentBuckets.ready + intentBuckets.high} sampled sessions look warm-or-better on intent heuristics — prioritize replay review.`,
    );
  }
  if (aiOperatorHighlights.length === 0) {
    aiOperatorHighlights.push(
      "Collect more behavior events (watch targets + ingest) to unlock richer diagnostics — see /admin/behavior-intelligence/watch.",
    );
  }

  const topPagesWithSessions = await Promise.all(
    topPageRows.slice(0, 12).map(async (row) => {
      const page = row.page;
      const [sr] = await db
        .select({ c: sql<number>`count(distinct ${behaviorEvents.sessionId})`.mapWith(Number) })
        .from(behaviorEvents)
        .where(
          and(
            gte(behaviorEvents.timestamp, since),
            sql`${behaviorEvents.metadata}->>'page' = ${page}`,
          ),
        );
      return { page, sessions: sr?.c ?? 0, events: Number(row.events) };
    }),
  );

  return {
    periodDays,
    sinceIso,
    totals: {
      sessions: sessionsN,
      uniqueSessions: sessionsN,
      behaviorEvents: Number(eventAgg?.c ?? 0),
      heatmapPoints: Number(heatmapAgg?.c ?? 0),
      convertedSessions: Number(convertedAgg?.c ?? 0),
      replaySegments: Number(replayAgg?.c ?? 0),
    },
    deviceSplit: deviceRows.map((r) => ({ device: r.device, sessions: Number(r.c) })),
    topPages: topPagesWithSessions,
    eventTypes: eventTypeRows.map((r) => ({ type: r.type, count: Number(r.c) })),
    topFrictionPages: latestFriction.map((f) => ({
      page: f.page,
      rageClicks: f.rageClicks,
      deadClicks: f.deadClicks,
      dropOffRate: f.dropOffRate,
      summary: f.summary,
      createdAt: f.createdAt.toISOString(),
    })),
    surveyPulse,
    intentDistribution,
    aiOperatorHighlights,
    experimentHooks: {
      message:
        "Link diagnostics to Ascendra Experimentation Engine tests when you promote an insight to a measurable variant.",
      adminExperimentsUrl: "/admin/experiments",
    },
  };
}

const CLIENT_SUBTITLE =
  "See what visitors are doing, where they drop off, and what improvements can increase conversions.";

function premiumEmptyPayload(periodDays: number, sinceIso: string, contactCount: number): Omit<
  ClientConversionDiagnostics,
  | "mode"
  | "businessLabel"
  | "headline"
  | "subhead"
  | "snapshot"
  | "whatsWorking"
  | "needsAttention"
  | "recommendedFixes"
  | "recentProgress"
  | "trafficOverview"
  | "topPages"
  | "formAndCta"
  | "surveyThemes"
  | "intentSummary"
  | "heatmapHint"
  | "privacyNote"
> {
  return {
    periodDays,
    sinceIso,
    lastUpdatedIso: new Date().toISOString(),
    clientSubtitle: CLIENT_SUBTITLE,
    executiveMetrics: [
      { id: "visitors", label: "Visitors", value: "—", sublabel: "Links to your CRM profile" },
      { id: "sessions", label: "Sessions", value: "—", sublabel: `${periodDays}-day window` },
      { id: "leads", label: "Recorded conversions", value: "—", sublabel: "From linked sessions" },
      { id: "rate", label: "Conversion rate", value: "—", sublabel: "When volume allows" },
      { id: "source", label: "Top traffic source", value: "—", sublabel: "UTM when captured" },
      { id: "page", label: "Page needing attention", value: "—", sublabel: "Friction-aware" },
    ],
    conversionSnapshot: {
      working:
        "Your Ascendra workspace is active — we’ll showcase wins here as behavior data links to your business profile.",
      attention:
        contactCount < 1 ?
          "We don’t see a CRM contact tied to your login yet — your Ascendra lead can connect your profile for personalized diagnostics."
        : "Waiting for the first linked sessions — watch targets and ingest bridge must include your site paths.",
      opportunity:
        "Clarify your primary offer above the fold and tighten the mobile path to book or contact — we’ll quantify impact once traffic is tracked.",
      movement:
        "Trend lines and period comparisons appear after enough linked sessions accumulate — typically within the first few weeks.",
    },
    behaviorHighlights: [
      "As visitors engage, we’ll describe scroll patterns, repeat interest, and where people hesitate — without exposing raw technical logs.",
    ],
    pagePerformance: [],
    frictionPoints: [],
    heatmapHighlights: [
      "Heatmap highlights summarize where people click and what they ignore — your operator can open full overlays in Ascendra Growth Intelligence.",
    ],
    heatmapPageSummaries: [],
    sessionHighlights: [],
    feedbackInsights: [
      "Survey and on-page feedback themes will appear when micro-prompts are enabled on your properties.",
    ],
    recommendedActions: [
      {
        title: "Connect tracking on high-intent pages",
        why: "Pricing, booking, and contact paths need visible instrumentation to diagnose drop-off.",
        affectedArea: "Site / watch targets",
        expectedBenefit: "Clear picture of where leads stall before they become opportunities.",
        priority: "high",
        status: "recommended",
      },
      {
        title: "Label primary CTAs with stable tags",
        why: "Makes click performance comparable week over week.",
        affectedArea: "Key buttons & forms",
        expectedBenefit: "Cleaner CTA reporting in your next diagnostic snapshot.",
        priority: "medium",
        status: "recommended",
      },
    ],
    trends: [],
    trafficSources: [],
    formFunnelHints: [
      {
        label: "Forms & CTAs",
        detail:
          "Instrument form_start, form_submit, and cta_click (with data attributes) for funnel clarity — numbers flow into this dashboard automatically.",
      },
    ],
  };
}

export async function buildClientConversionDiagnostics(
  userId: number,
  opts?: { days?: number },
): Promise<ClientConversionDiagnostics> {
  const periodDays = Math.min(90, Math.max(7, Math.floor(opts?.days ?? 30)));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
  const lastUpdatedIso = new Date().toISOString();

  const user = await storage.getUser(userId);
  const emailRaw = user?.email?.trim() ?? "";
  const businessLabel =
    (user && "full_name" in user && typeof (user as { full_name?: string }).full_name === "string"
      ? (user as { full_name: string }).full_name
      : null)?.trim() || emailRaw || "Your business";

  const crmRows = emailRaw ? await storage.getCrmContactsByNormalizedEmails([emailRaw]) : [];
  const contactIds = crmRows.map((c) => c.id);
  const premiumBase = premiumEmptyPayload(periodDays, sinceIso, contactIds.length);

  const emptyPreview = (): ClientConversionDiagnostics => ({
    mode: "preview_empty",
    businessLabel,
    headline: "Conversion Diagnostics",
    subhead:
      "When your site is wired into Ascendra’s behavior layer and your account is linked to tracked sessions, this dashboard shows how visitors move, hesitate, and convert — in plain language.",
    snapshot: {
      sessions: 0,
      pageViewsApprox: 0,
      convertedSessions: 0,
      highFrictionPages: 0,
    },
    whatsWorking: [
      "Your client workspace is active — Ascendra can connect diagnostics to your property as tracking and CRM linkage are enabled.",
    ],
    needsAttention: [
      "No linked session data yet for your CRM profile — ask your Ascendra lead to verify watch targets and optional CRM bridge on ingest.",
    ],
    recommendedFixes: [
      "Confirm high-value pages (pricing, booking, contact) are included in watch targets.",
      "Add clear primary CTAs on mobile-first layouts — we’ll quantify clicks once recording is live.",
    ],
    recentProgress: [
      "Baseline will appear here after the first week of captured sessions for your business.",
    ],
    trafficOverview: [
      { label: "Linked CRM contacts", value: String(contactIds.length) },
      { label: "Diagnostic window", value: `${periodDays} days` },
    ],
    topPages: [],
    formAndCta: [
      {
        label: "Forms & CTAs",
        detail: "Completion and click-through summaries will populate from behavior events (form_start, form_submit, cta_click).",
      },
    ],
    surveyThemes: [],
    intentSummary: "Once sessions are linked, we’ll summarize intent bands without exposing internal scoring formulas.",
    heatmapHint: "Heatmap highlights for your pages appear after click capture is enabled on your domains.",
    privacyNote:
      "Inputs and sensitive fields are masked in replay. You see business-ready summaries — not raw personal data.",
    ...premiumBase,
  });

  if (contactIds.length < 1) {
    return emptyPreview();
  }

  const linkedWhere = and(
    gte(behaviorSessions.startTime, since),
    isNull(behaviorSessions.softDeletedAt),
    inArray(behaviorSessions.crmContactId, contactIds),
  );

  const linkedSessionRows = await db
    .select({ id: behaviorSessions.id, sessionKey: behaviorSessions.sessionId, converted: behaviorSessions.converted })
    .from(behaviorSessions)
    .where(linkedWhere);

  const linkedIds = linkedSessionRows.map((r) => r.id);
  const convertedById = new Map(linkedSessionRows.map((r) => [r.id, r.converted]));

  if (linkedIds.length < 1) {
    const frictionRowsEmpty = await db
      .select()
      .from(behaviorFrictionReports)
      .where(gte(behaviorFrictionReports.createdAt, since))
      .orderBy(desc(behaviorFrictionReports.deadClicks))
      .limit(5);
    return {
      ...emptyPreview(),
      snapshot: {
        sessions: 0,
        pageViewsApprox: 0,
        convertedSessions: 0,
        highFrictionPages: frictionRowsEmpty.filter((f) => (f.deadClicks ?? 0) + (f.rageClicks ?? 0) > 3).length,
      },
    };
  }

  const [[sessC], [evApprox], [convC]] = await Promise.all([
    db.select({ c: count() }).from(behaviorSessions).where(linkedWhere),
    db
      .select({ c: count() })
      .from(behaviorEvents)
      .where(and(gte(behaviorEvents.timestamp, since), inArray(behaviorEvents.behaviorSessionId, linkedIds))),
    db
      .select({ c: count() })
      .from(behaviorSessions)
      .where(and(linkedWhere, eq(behaviorSessions.converted, true))),
  ]);

  const sessions = Number(sessC?.c ?? 0);
  const pageViewsApprox = Number(evApprox?.c ?? 0);
  const convertedSessions = Number(convC?.c ?? 0);
  const convRatePct = sessions > 0 ? Math.round((convertedSessions / sessions) * 1000) / 10 : 0;

  const frictionRows = await db
    .select()
    .from(behaviorFrictionReports)
    .where(gte(behaviorFrictionReports.createdAt, since))
    .orderBy(desc(behaviorFrictionReports.deadClicks))
    .limit(8);

  const pex = pageExpr();
  const topPageRows = await db
    .select({
      page: pex,
      ev: count(),
    })
    .from(behaviorEvents)
    .where(and(gte(behaviorEvents.timestamp, since), inArray(behaviorEvents.behaviorSessionId, linkedIds), sql`${pex} is not null`))
    .groupBy(pex)
    .orderBy(desc(count()))
    .limit(8);

  const topPages = await Promise.all(
    topPageRows.map(async (row) => {
      const [sr] = await db
        .select({ c: sql<number>`count(distinct ${behaviorEvents.sessionId})`.mapWith(Number) })
        .from(behaviorEvents)
        .where(
          and(
            gte(behaviorEvents.timestamp, since),
            inArray(behaviorEvents.behaviorSessionId, linkedIds),
            sql`${behaviorEvents.metadata}->>'page' = ${row.page}`,
          ),
        );
      return { path: row.page, sessions: sr?.c ?? 0 };
    }),
  );

  const highFrictionPages = frictionRows.filter((f) => (f.deadClicks ?? 0) + (f.rageClicks ?? 0) > 3).length;

  const frictionPageSet = new Set(frictionRows.map((f) => normPagePath(f.page)));

  const pagePerformance: ClientPagePerformanceRow[] = topPages.map((p) => {
    const bad = frictionPageSet.has(normPagePath(p.path));
    const status: ClientPagePerformanceRow["status"] =
      bad ? "attention"
      : p.sessions >= 3 && convertedSessions > 0 ? "strong"
      : p.sessions >= 2 ? "stable"
      : "stable";
    return {
      path: p.path,
      visitors: p.sessions,
      engagementLabel: p.sessions >= 5 ? "Strong activity" : p.sessions >= 2 ? "Moderate" : "Early sample",
      conversionsLabel: convertedSessions > 0 ? "See account rollups" : "No recorded completions yet",
      frictionLabel: bad ? "Friction signals" : "None flagged",
      status,
    };
  });

  const frictionPoints: ClientFrictionPoint[] = frictionRows.slice(0, 6).map((f) => {
    const total = (f.deadClicks ?? 0) + (f.rageClicks ?? 0);
    const priority: ClientFrictionPoint["priority"] =
      total >= 12 ? "high" : total >= 5 ? "medium" : "monitor";
    return {
      title: `Visitors may be getting stuck on this page`,
      explanation: f.summary ?? "We’re seeing clicks that don’t advance visitors — often a clarity or mobile layout issue.",
      priority,
      affectedArea: f.page,
      suggestedNext: "Review the primary CTA and simplify the next step on smaller screens.",
    };
  });

  const sourceLabelExpr = sql<string>`coalesce(nullif(trim(${behaviorSessions.sourceJson}->>'utm_source'), ''), 'Direct / other')`;
  const trafficSources = await db
    .select({
      label: sourceLabelExpr,
      c: count(),
    })
    .from(behaviorSessions)
    .where(linkedWhere)
    .groupBy(sourceLabelExpr)
    .orderBy(desc(count()))
    .limit(6)
    .then((rows) =>
      rows.map((r) => ({
        label: r.label,
        sessions: Number(r.c),
        note: r.label === "Direct / other" ? "Add UTM parameters on campaigns for clearer source quality." : undefined,
      })),
    );

  const deviceSplit = await db
    .select({
      device: sql<string>`coalesce(nullif(trim(${behaviorSessions.device}), ''), 'Unknown')`,
      c: count(),
    })
    .from(behaviorSessions)
    .where(linkedWhere)
    .groupBy(behaviorSessions.device);

  const trendSessionRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${behaviorSessions.startTime}), 'YYYY-MM-DD')`,
      c: count(),
    })
    .from(behaviorSessions)
    .where(linkedWhere)
    .groupBy(sql`date_trunc('day', ${behaviorSessions.startTime})`)
    .orderBy(sql`date_trunc('day', ${behaviorSessions.startTime})`);

  const trendEventRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${behaviorEvents.timestamp}), 'YYYY-MM-DD')`,
      c: count(),
    })
    .from(behaviorEvents)
    .where(and(gte(behaviorEvents.timestamp, since), inArray(behaviorEvents.behaviorSessionId, linkedIds)))
    .groupBy(sql`date_trunc('day', ${behaviorEvents.timestamp})`)
    .orderBy(sql`date_trunc('day', ${behaviorEvents.timestamp})`);

  const evByDay = new Map(trendEventRows.map((r) => [r.day, Number(r.c)]));
  const trends = trendSessionRows.map((r) => ({
    date: r.day,
    label: r.day,
    sessions: Number(r.c),
    interactions: evByDay.get(r.day) ?? 0,
  }));

  const sessionIdStrings = linkedSessionRows.map((r) => r.sessionKey);
  const heatAgg =
    sessionIdStrings.length > 0 ?
      await db
        .select({
          page: behaviorHeatmapEvents.page,
          c: count(),
        })
        .from(behaviorHeatmapEvents)
        .where(and(gte(behaviorHeatmapEvents.createdAt, since), inArray(behaviorHeatmapEvents.sessionId, sessionIdStrings)))
        .groupBy(behaviorHeatmapEvents.page)
        .orderBy(desc(count()))
        .limit(4)
    : [];

  const heatmapHighlights: string[] = [];
  if (heatAgg[0]) {
    heatmapHighlights.push(
      `Most clicks are concentrated on ${heatAgg[0]!.page} — that’s where attention (and competition for focus) is highest.`,
    );
  }
  if (topPages[0] && heatAgg[0] && topPages[0]!.path !== heatAgg[0]!.page) {
    heatmapHighlights.push(
      `High read traffic may still cluster on ${topPages[0]!.path} while taps concentrate elsewhere — check whether your core offer appears before visitors decide.`,
    );
  }
  if (heatmapHighlights.length === 0) {
    heatmapHighlights.push(
      "Click heat summaries will appear once heatmap capture runs on your tracked pages — ask Ascendra to enable watch targets.",
    );
  }

  const eventTypeRows = await db
    .select({ type: behaviorEvents.type, c: count() })
    .from(behaviorEvents)
    .where(and(gte(behaviorEvents.timestamp, since), inArray(behaviorEvents.behaviorSessionId, linkedIds)))
    .groupBy(behaviorEvents.type)
    .orderBy(desc(count()))
    .limit(24);

  const formFunnelHints: { label: string; detail: string }[] = [];
  const formStart = eventTypeRows.find((e) => e.type.includes("form") && e.type.includes("start"));
  const formSubmit = eventTypeRows.find((e) => e.type.includes("form") && (e.type.includes("submit") || e.type.includes("completed")));
  const ctaClick = eventTypeRows.find((e) => e.type === "cta_click" || e.type === "click");
  if (formStart) {
    formFunnelHints.push({
      label: "Form starts",
      detail: `${Number(formStart.c)} starts observed — ${formSubmit ? `${Number(formSubmit.c)} completions` : "completion events not yet separated"} in this window.`,
    });
  }
  if (ctaClick) {
    formFunnelHints.push({
      label: "CTA / click activity",
      detail: `${Number(ctaClick.c)} CTA-related interactions — compare to completed conversions (${convertedSessions}) to spot click-without-outcome gaps.`,
    });
  }
  if (formFunnelHints.length === 0) {
    formFunnelHints.push({
      label: "Forms & CTAs",
      detail:
        pageViewsApprox > 0 ?
          `${pageViewsApprox} behavior events logged — add form_* and cta_click instrumentation for funnel storytelling.`
        : "Event volume still ramping.",
    });
  }

  const topEngaged = await db
    .select({
      bid: behaviorEvents.behaviorSessionId,
      c: count(),
    })
    .from(behaviorEvents)
    .where(
      and(
        gte(behaviorEvents.timestamp, since),
        inArray(behaviorEvents.behaviorSessionId, linkedIds),
        isNotNull(behaviorEvents.behaviorSessionId),
      ),
    )
    .groupBy(behaviorEvents.behaviorSessionId)
    .orderBy(desc(count()))
    .limit(4);

  const sessionHighlights: ClientSessionHighlight[] = [];
  for (const row of topEngaged) {
    const bid = row.bid!;
    const conv = convertedById.get(bid);
    const n = Number(row.c);
    if (n < 8) continue;
    sessionHighlights.push({
      summary: conv ?
        `A high-activity session (${n} logged interactions) aligned with a recorded conversion — strong buying motion.`
      : `A visitor session stayed engaged (${n} interactions) without showing a completed conversion in this window — worth reviewing the final step with your Ascendra strategist.`,
      tags: conv ? ["High engagement", "Converted"] : ["High engagement", "No completion signal"],
    });
  }

  const whatsWorking: string[] = [];
  if (convertedSessions > 0) {
    whatsWorking.push(`${convertedSessions} session(s) in this window reached a recorded conversion — momentum is measurable.`);
  }
  if (topPages[0]) {
    whatsWorking.push(`Strongest page by activity: ${topPages[0]!.path} — visitors are engaging here.`);
  }
  if (deviceSplit.some((d) => d.device === "mobile" && Number(d.c) >= sessions * 0.4)) {
    whatsWorking.push("Mobile represents a meaningful share of sessions — prioritizing mobile clarity protects conversions.");
  }
  if (whatsWorking.length === 0) {
    whatsWorking.push("Tracking is live for your linked profile — we’ll highlight wins as volume grows.");
  }

  const needsAttention: string[] = [];
  for (const f of frictionRows.slice(0, 3)) {
    if ((f.deadClicks ?? 0) > 0 || (f.rageClicks ?? 0) > 0) {
      needsAttention.push(
        `Visitors may be struggling on ${f.page}: ${f.summary ?? "review layout and CTA targets on mobile."}`,
      );
    }
  }
  if (pageViewsApprox > 0 && convertedSessions === 0) {
    needsAttention.push(
      "Visitors are active but conversions aren’t showing in this window — we should validate form and booking instrumentation.",
    );
  }
  if (deviceSplit.find((d) => d.device === "mobile" && Number(d.c) > 0) && frictionPoints.some((p) => p.priority === "high")) {
    needsAttention.push("Friction signals coincide with mobile traffic — worth a focused pass on thumb reach and form fields.");
  }

  const recommendedFixes = [
    ...needsAttention.map((n) => (n.includes("mobile") ? n : `${n} Consider a focused test on the primary CTA.`)),
  ].slice(0, 4);
  if (recommendedFixes.length === 0) {
    recommendedFixes.push("Keep monitoring — no urgent friction flags in the latest rollups.");
  }

  const recommendedActions: ClientRecommendedAction[] = recommendedFixes.slice(0, 5).map((msg, i) => ({
    title: i === 0 ? "Resolve top friction page" : "Optimization follow-up",
    why: msg,
    affectedArea: frictionRows[0]?.page ?? "Site-wide",
    expectedBenefit: "Fewer abandonments on the final steps of your funnel.",
    priority: i === 0 ? "high" : "medium",
    status: "recommended",
  }));

  const intentSummary =
    convertedSessions >= sessions * 0.15 && sessions >= 5 ?
      "A healthy share of sessions look outcome-focused — we’ll keep pressure on the booking path."
    : sessions >= 5 ?
      "Intent is mixed — tightening clarity on pricing and booking usually lifts conversion without more traffic."
    : "Early sample — intent summary will stabilize as more sessions accrue.";

  const topSource = trafficSources[0];

  const behaviorHighlights: string[] = [];
  if (pageViewsApprox > 0 && topPages[0]) {
    behaviorHighlights.push(
      `Many recorded interactions involve ${topPages[0]!.path} — that’s your current anchor for understanding visitor intent.`,
    );
  }
  if (sessionHighlights.length > 0) {
    behaviorHighlights.push(
      "Some visitors show repeat-level engagement without converting yet — pairing clarity + proof often moves them to act.",
    );
  }
  if (behaviorHighlights.length === 0) {
    behaviorHighlights.push("Behavior narratives will deepen as more page paths and events accumulate.");
  }

  const opportunity =
    frictionPoints[0] ?
      `Addressing confusion on **${frictionPoints[0]!.affectedArea}** is likely the fastest path to fewer lost leads.`
    : "Tightening your primary offer and CTA sequence is the default highest-leverage move while data accrues.";

  const executiveMetrics = [
    { id: "visitors", label: "Unique session volume", value: String(sessions), sublabel: `${periodDays}d · CRM-linked` },
    {
      id: "leads",
      label: "Recorded conversions",
      value: String(convertedSessions),
      sublabel: sessions > 0 ? `${convRatePct}% of sessions` : "—",
    },
    {
      id: "rate",
      label: "Conversion rate",
      value: sessions > 0 ? `${convRatePct}%` : "—",
      sublabel: "Linked scope",
    },
    {
      id: "source",
      label: "Top traffic source",
      value: topSource?.label ?? "—",
      sublabel: topSource ? `${topSource.sessions} sessions` : "Add UTMs for precision",
    },
    {
      id: "page",
      label: "Page needing attention",
      value: frictionRows[0]?.page ?? topPages[topPages.length - 1]?.path ?? "—",
      sublabel: frictionRows[0] ? "Friction rollup" : "Watch list",
    },
    {
      id: "sessions",
      label: "Behavior events",
      value: String(pageViewsApprox),
      sublabel: "Approx. interactions",
    },
  ];

  const conversionSnapshot = {
    working: whatsWorking[0] ?? "Momentum is building as we capture more behavior.",
    attention: needsAttention[0] ?? "No urgent alerts — keep nurturing clarity on key pages.",
    opportunity,
    movement:
      trends.length >= 2 ?
        `Recent days show ${trends[trends.length - 1]!.sessions} sessions in the latest bucket vs ${trends[0]!.sessions} earlier in this window — ask Ascendra for a guided interpretation.`
      : "Trend comparison strengthens as additional calendar days accrue.",
  };

  const surveyRows =
    sessionIdStrings.length > 0 ?
      await db
        .select({ q: behaviorSurveys.question, c: count() })
        .from(behaviorSurveyResponses)
        .innerJoin(behaviorSurveys, eq(behaviorSurveyResponses.surveyId, behaviorSurveys.id))
        .where(
          and(gte(behaviorSurveyResponses.createdAt, since), inArray(behaviorSurveyResponses.sessionId, sessionIdStrings)),
        )
        .groupBy(behaviorSurveys.question)
        .orderBy(desc(count()))
        .limit(4)
    : [];

  const surveyThemes =
    surveyRows.length > 0 ?
      surveyRows.map((s) => `“${s.q.slice(0, 120)}${s.q.length > 120 ? "…" : ""}” — ${Number(s.c)} recent responses in your linked scope.`)
    : ["Survey themes will populate when responses tie to your linked visitor sessions."];

  const feedbackInsights =
    surveyThemes.length > 0 && surveyThemes[0] !==
      "Survey themes will populate when responses tie to your linked visitor sessions." ?
      [
        "We’re hearing directly from visitors — patterns here should inform your next copy and UX fixes.",
        ...surveyThemes.slice(0, 3),
      ]
    : [
        "No survey themes in this window yet — Ascendra can activate micro-prompts after key actions.",
      ];

  const phase2 = await buildClientPhase2Overlay({
    contactIds,
    since,
    periodDays,
    sessions,
    convertedSessions,
    pageViewsApprox,
    highFrictionPages,
    topSourceLabel: topSource?.label,
  });

  return {
    mode: "live",
    businessLabel,
    sinceIso,
    periodDays,
    lastUpdatedIso,
    clientSubtitle: CLIENT_SUBTITLE,
    headline: "Conversion Diagnostics",
    subhead: `Snapshot for ${businessLabel} — behavior linked via CRM — last ${periodDays} days.`,
    snapshot: {
      sessions,
      pageViewsApprox,
      convertedSessions,
      highFrictionPages,
    },
    whatsWorking,
    needsAttention: needsAttention.slice(0, 5),
    recommendedFixes,
    recentProgress: [
      "Compare upcoming weeks side-by-side once your baseline firms up — your strategist can annotate wins here.",
    ],
    trafficOverview: [
      { label: "Sessions (linked)", value: String(sessions) },
      { label: "Approx. interactions", value: String(pageViewsApprox) },
      { label: "Recorded conversions", value: String(convertedSessions) },
      { label: "Friction pages flagged", value: String(highFrictionPages) },
    ],
    topPages,
    formAndCta: formFunnelHints,
    formFunnelHints,
    surveyThemes,
    intentSummary,
    heatmapHint:
      heatmapHighlights[0] ??
      "Ask Ascendra for heatmap overlays on your top paths — click density clarifies dead zones quickly.",
    privacyNote:
      "Summaries are privacy-safe. Full session replay stays with Ascendra operators unless you request a guided review.",
    executiveMetrics,
    conversionSnapshot,
    behaviorHighlights,
    pagePerformance,
    frictionPoints,
    heatmapHighlights,
    heatmapPageSummaries: heatAgg
      .filter((h) => h.page && String(h.page).trim().length > 0)
      .map((h) => ({ path: String(h.page), heatmapClicks: Number(h.c) })),
    sessionHighlights,
    feedbackInsights,
    recommendedActions,
    trends,
    trafficSources,
    phase2,
  };
}
