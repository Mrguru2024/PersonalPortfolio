import { storage } from "@server/storage";
import { db } from "@server/db";
import { desc, eq } from "drizzle-orm";
import { ppcCampaigns, ppcLeadQuality } from "@shared/paidGrowthSchema";
import {
  type OfferEngineOfferTemplateRow,
  type OfferEngineLeadMagnetTemplateRow,
} from "@shared/offerEngineSchema";
import {
  getLeadMagnetTemplateBySlug,
  getOfferTemplateBySlug,
  listLeadMagnetTemplates,
  listOfferTemplates,
} from "./offerEngineService";

type OfferPerformance = {
  offerId: number;
  offerSlug: string;
  offerName: string;
  offerScore: number | null;
  leads: number;
  qualifiedLeads: number;
  bookedCalls: number;
  sales: number;
  conversionRate: number;
  bookedCallRate: number;
  leadQualityRate: number;
  underperformingStage: "lead_capture" | "qualification" | "booked_call" | "sales" | null;
  warnings: string[];
};

type LeadMagnetPerformance = {
  leadMagnetId: number;
  leadMagnetSlug: string;
  leadMagnetName: string;
  leadMagnetScore: number | null;
  linkedOfferSlug: string | null;
  views: number;
  optIns: number;
  nextStepClicks: number;
  bookedCalls: number;
  sales: number;
  leadQualityRate: number;
  conversionRateAfterMagnet: number;
  warnings: string[];
};

type RelationshipInsight = {
  leadMagnetSlug: string;
  leadMagnetName: string;
  offerSlug: string | null;
  offerName: string | null;
  handoffScore: number;
  qualityVsVolume: "high_volume_low_quality" | "low_volume_high_intent" | "balanced" | "insufficient_data";
  warnings: string[];
  recommendations: string[];
};

export type OfferLeadMagnetIntelligenceSnapshot = {
  generatedAt: string;
  offers: OfferPerformance[];
  leadMagnets: LeadMagnetPerformance[];
  relationships: RelationshipInsight[];
  topOffersByConversion: OfferPerformance[];
  topOffersByLeadQuality: OfferPerformance[];
  topOffersByBookedCallRate: OfferPerformance[];
  topOffersByRevenue: OfferPerformance[];
  highestValueMagnets: LeadMagnetPerformance[];
  lowIntentMagnets: LeadMagnetPerformance[];
  highIntentMagnets: LeadMagnetPerformance[];
  weakJourneyChains: RelationshipInsight[];
  missingSupportingLeadMagnets: string[];
  orphanLeadMagnets: string[];
  topRecommendations: string[];
};

type SnapshotFilterArgs = {
  offerTemplateSlug?: string | null;
  leadMagnetTemplateSlug?: string | null;
  relatedOfferTemplateId?: number | null;
  personaId?: string | null;
};

type SnapshotFilterInput = SnapshotFilterArgs | string | undefined;

type OfferLeadMagnetIntelligenceResult = {
  warnings: string[];
  recommendations: string[];
  mismatchWarnings: string[];
  bestJourneyCombinations: RelationshipInsight[];
  weakJourneyCombinations: RelationshipInsight[];
};

function pct(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

function scoreOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function clampFloat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function inferUnderperformingStage(args: {
  leads: number;
  qualifiedLeads: number;
  bookedCalls: number;
  sales: number;
}): OfferPerformance["underperformingStage"] {
  if (args.leads === 0) return "lead_capture";
  if (args.qualifiedLeads / args.leads < 0.35) return "qualification";
  if (args.bookedCalls / Math.max(1, args.qualifiedLeads) < 0.35) return "booked_call";
  if (args.sales / Math.max(1, args.bookedCalls) < 0.25) return "sales";
  return null;
}

function parseMagnetSlugFromPath(path: string | null | undefined): string | null {
  const v = String(path ?? "").trim().toLowerCase();
  if (!v) return null;
  const chunks = v.split("?")[0].split("/").filter(Boolean);
  if (chunks.length === 0) return null;
  return chunks[chunks.length - 1] ?? null;
}

function normalizeOfferSlugFromContact(contact: {
  customFields?: Record<string, unknown> | null;
}): string | null {
  const cf = (contact.customFields ?? {}) as Record<string, unknown>;
  const raw = cf.offerEngineTemplateSlug ?? cf.offerSlug ?? cf.latestOfferValuationName;
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  return v || null;
}

function normalizeLeadMagnetSlugFromContact(contact: {
  customFields?: Record<string, unknown> | null;
  landingPage?: string | null;
}): string | null {
  const cf = (contact.customFields ?? {}) as Record<string, unknown>;
  const direct = cf.leadMagnetSlug;
  if (typeof direct === "string" && direct.trim()) return direct.trim().toLowerCase();
  return parseMagnetSlugFromPath(contact.landingPage);
}

function countByOfferAndMagnet<T extends { offerSlug: string | null; magnetSlug: string | null }>(
  rows: T[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) {
    if (!row.offerSlug || !row.magnetSlug) continue;
    const key = `${row.offerSlug}__${row.magnetSlug}`;
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}

function sortDescBy<T>(rows: T[], pick: (x: T) => number): T[] {
  return [...rows].sort((a, b) => pick(b) - pick(a));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => Boolean(value?.trim())))];
}

function normalizeSnapshotFilterArgs(input: SnapshotFilterInput): SnapshotFilterArgs {
  if (!input) return {};
  if (typeof input === "string") {
    return { personaId: input.trim() || null };
  }
  return {
    offerTemplateSlug: input.offerTemplateSlug?.trim().toLowerCase() ?? null,
    leadMagnetTemplateSlug: input.leadMagnetTemplateSlug?.trim().toLowerCase() ?? null,
    relatedOfferTemplateId: input.relatedOfferTemplateId ?? null,
    personaId: input.personaId?.trim() ?? null,
  };
}

async function resolveOfferBySlugCached(
  slug: string | null,
  cache: Map<string, OfferEngineOfferTemplateRow | null>,
): Promise<OfferEngineOfferTemplateRow | null> {
  if (!slug) return null;
  if (cache.has(slug)) return cache.get(slug) ?? null;
  const row = await getOfferTemplateBySlug(slug);
  cache.set(slug, row);
  return row;
}

async function resolveLeadMagnetBySlugCached(
  slug: string | null,
  cache: Map<string, OfferEngineLeadMagnetTemplateRow | null>,
): Promise<OfferEngineLeadMagnetTemplateRow | null> {
  if (!slug) return null;
  if (cache.has(slug)) return cache.get(slug) ?? null;
  const row = await getLeadMagnetTemplateBySlug(slug);
  cache.set(slug, row);
  return row;
}

export async function buildOfferLeadMagnetIntelligence(): Promise<OfferLeadMagnetIntelligenceSnapshot> {
  const [offers, leadMagnets, contacts, deals, ppcRows, campaigns, publishedMagnetAssets] =
    await Promise.all([
      listOfferTemplates(),
      listLeadMagnetTemplates(),
      storage.getCrmContacts("lead", 2000),
      storage.getCrmDeals(),
      storage.listPpcLeadQuality(2000),
      db.select().from(ppcCampaigns).orderBy(desc(ppcCampaigns.updatedAt)),
      storage.listFunnelContentAssets({ status: "published" }),
    ]);

  const offerBySlug = new Map<string, OfferEngineOfferTemplateRow>();
  for (const offer of offers) {
    offerBySlug.set(offer.slug, offer);
  }
  const magnetBySlug = new Map<string, OfferEngineLeadMagnetTemplateRow>();
  for (const magnet of leadMagnets) {
    magnetBySlug.set(magnet.slug, magnet);
  }

  const campaignOfferMap = new Map<number, string | null>();
  for (const campaign of campaigns) {
    campaignOfferMap.set(campaign.id, campaign.offerSlug?.trim().toLowerCase() ?? null);
  }
  const ppcByContact = new Map<number, (typeof ppcRows)[number]>();
  for (const row of ppcRows) {
    ppcByContact.set(row.crmContactId, row);
  }

  const offerSlugResolverCache = new Map<string, OfferEngineOfferTemplateRow | null>();
  const magnetSlugResolverCache = new Map<string, OfferEngineLeadMagnetTemplateRow | null>();

  const contactRows = [];
  for (const contact of contacts) {
    const directOfferSlug = normalizeOfferSlugFromContact(contact);
    const contactPpc = ppcByContact.get(contact.id);
    const ppcOfferSlug =
      contactPpc?.ppcCampaignId != null
        ? campaignOfferMap.get(contactPpc.ppcCampaignId) ?? null
        : null;
    const inferredOfferSlug = ppcOfferSlug ?? directOfferSlug;
    const resolvedOffer = await resolveOfferBySlugCached(
      inferredOfferSlug,
      offerSlugResolverCache,
    );
    const offerSlug = resolvedOffer?.slug ?? inferredOfferSlug ?? null;

    const rawMagnetSlug = normalizeLeadMagnetSlugFromContact(contact);
    const resolvedMagnet = await resolveLeadMagnetBySlugCached(
      rawMagnetSlug,
      magnetSlugResolverCache,
    );
    const magnetSlug = resolvedMagnet?.slug ?? rawMagnetSlug ?? null;

    contactRows.push({
      contact,
      offerSlug,
      magnetSlug,
      ppc: contactPpc,
      bookedCall: Boolean(contact.bookedCallAt),
      qualified:
        contact.lifecycleStage === "qualified" ||
        contact.lifecycleStage === "sales_ready" ||
        (contact.leadScore ?? 0) >= 65 ||
        (contactPpc?.fitScore ?? 0) >= 7,
    });
  }

  const soldByContact = new Map<number, boolean>();
  for (const deal of deals) {
    if (!deal.contactId) continue;
    if (deal.pipelineStage === "won") {
      soldByContact.set(deal.contactId, true);
    }
  }

  const offerMetrics = new Map<string, OfferPerformance>();
  for (const offer of offers) {
    offerMetrics.set(offer.slug, {
      offerId: offer.id,
      offerSlug: offer.slug,
      offerName: offer.name,
      offerScore: scoreOrNull(offer.scoreCacheJson?.overall),
      leads: 0,
      qualifiedLeads: 0,
      bookedCalls: 0,
      sales: 0,
      conversionRate: 0,
      bookedCallRate: 0,
      leadQualityRate: 0,
      underperformingStage: null,
      warnings: [],
    });
  }

  const magnetMetrics = new Map<string, LeadMagnetPerformance>();
  for (const magnet of leadMagnets) {
    magnetMetrics.set(magnet.slug, {
      leadMagnetId: magnet.id,
      leadMagnetSlug: magnet.slug,
      leadMagnetName: magnet.name,
      leadMagnetScore: scoreOrNull(magnet.scoreCacheJson?.overall),
      linkedOfferSlug:
        magnet.relatedOfferTemplateId != null
          ? offers.find((o) => o.id === magnet.relatedOfferTemplateId)?.slug ?? null
          : null,
      views: 0,
      optIns: 0,
      nextStepClicks: 0,
      bookedCalls: 0,
      sales: 0,
      leadQualityRate: 0,
      conversionRateAfterMagnet: 0,
      warnings: [],
    });
  }

  for (const asset of publishedMagnetAssets) {
    const slug = asset.leadMagnetSlug?.trim().toLowerCase();
    if (!slug) continue;
    const metric = magnetMetrics.get(slug);
    if (metric) metric.views += 1;
  }

  for (const row of contactRows) {
    if (row.offerSlug && offerMetrics.has(row.offerSlug)) {
      const metric = offerMetrics.get(row.offerSlug)!;
      metric.leads += 1;
      if (row.qualified) metric.qualifiedLeads += 1;
      if (row.bookedCall) metric.bookedCalls += 1;
      if (soldByContact.get(row.contact.id)) metric.sales += 1;
    }

    if (row.magnetSlug && magnetMetrics.has(row.magnetSlug)) {
      const metric = magnetMetrics.get(row.magnetSlug)!;
      metric.optIns += 1;
      if (row.contact.lastActivityAt) metric.nextStepClicks += 1;
      if (row.bookedCall) metric.bookedCalls += 1;
      if (soldByContact.get(row.contact.id)) metric.sales += 1;
    }
  }

  for (const metric of offerMetrics.values()) {
    metric.conversionRate = pct(metric.sales, metric.leads);
    metric.bookedCallRate = pct(metric.bookedCalls, metric.leads);
    metric.leadQualityRate = pct(metric.qualifiedLeads, metric.leads);
    metric.underperformingStage = inferUnderperformingStage({
      leads: metric.leads,
      qualifiedLeads: metric.qualifiedLeads,
      bookedCalls: metric.bookedCalls,
      sales: metric.sales,
    });
    if ((metric.offerScore ?? 0) >= 75 && metric.conversionRate < 8 && metric.leads >= 8) {
      metric.warnings.push(
        "Strong on-paper score but weak actual sales conversion; review traffic-message match.",
      );
    }
    if (metric.leads >= 8 && metric.bookedCallRate < 15) {
      metric.warnings.push(
        "Low booked-call rate for lead volume; tighten CTA sequencing and qualification routing.",
      );
    }
  }

  for (const metric of magnetMetrics.values()) {
    metric.leadQualityRate = pct(metric.bookedCalls, metric.optIns);
    metric.conversionRateAfterMagnet = pct(metric.sales, metric.optIns);
    if (metric.optIns >= 10 && metric.leadQualityRate < 12) {
      metric.warnings.push(
        "High opt-in volume with low intent quality; hook may be too broad for the target persona.",
      );
    }
    if (metric.optIns > 0 && !metric.linkedOfferSlug) {
      metric.warnings.push(
        "Lead magnet is generating opt-ins but has no explicit linked offer handoff.",
      );
    }
  }

  const relationshipPairs = countByOfferAndMagnet(
    contactRows.map((r) => ({ offerSlug: r.offerSlug, magnetSlug: r.magnetSlug })),
  );
  const relationships: RelationshipInsight[] = [];
  for (const [key, count] of relationshipPairs.entries()) {
    const [offerSlug, magnetSlug] = key.split("__");
    const offerMetric = offerMetrics.get(offerSlug);
    const magnetMetric = magnetMetrics.get(magnetSlug);
    if (!magnetMetric) continue;
    const handoffScore = clampFloat(
      ((offerMetric?.leadQualityRate ?? 0) * 0.4) +
        ((magnetMetric.leadQualityRate ?? 0) * 0.35) +
        ((offerMetric?.bookedCallRate ?? 0) * 0.25),
      0,
      100,
    );
    const qualityVsVolume: RelationshipInsight["qualityVsVolume"] =
      count >= 20 && handoffScore < 40
        ? "high_volume_low_quality"
        : count < 8 && handoffScore >= 60
          ? "low_volume_high_intent"
          : count < 4
            ? "insufficient_data"
            : "balanced";
    const warnings: string[] = [];
    const recommendations: string[] = [];
    if (qualityVsVolume === "high_volume_low_quality") {
      warnings.push(
        "This magnet-offer pair drives volume but weak buyer intent downstream.",
      );
      recommendations.push(
        "Narrow targeting and strengthen the bridge CTA before scaling paid traffic.",
      );
    }
    if (!offerSlug) {
      warnings.push("Lead magnet leads are not mapped to an offer.");
      recommendations.push(
        "Attach a primary offer handoff to avoid orphan nurturing paths.",
      );
    }
    if (!warnings.length) {
      recommendations.push("Maintain this pair and test one challenger hook against it.");
    }
    relationships.push({
      leadMagnetSlug: magnetSlug,
      leadMagnetName: magnetMetric.leadMagnetName,
      offerSlug: offerSlug || null,
      offerName: offerMetric?.offerName ?? null,
      handoffScore: Math.round(handoffScore),
      qualityVsVolume,
      warnings,
      recommendations,
    });
  }

  const offerList = [...offerMetrics.values()];
  const magnetList = [...magnetMetrics.values()];
  const missingSupportingLeadMagnets = offerList
    .filter(
      (offer) =>
        !leadMagnets.some(
          (lm) =>
            offers.find((o) => o.id === lm.relatedOfferTemplateId)?.slug === offer.offerSlug,
        ),
    )
    .map((offer) => offer.offerSlug);

  const orphanLeadMagnets = magnetList
    .filter((magnet) => !magnet.linkedOfferSlug)
    .map((magnet) => magnet.leadMagnetSlug);

  const topRecommendations = [
    ...offerList
      .filter((o) => o.warnings.length)
      .slice(0, 3)
      .map((o) => `${o.offerName}: ${o.warnings[0]}`),
    ...magnetList
      .filter((m) => m.warnings.length)
      .slice(0, 3)
      .map((m) => `${m.leadMagnetName}: ${m.warnings[0]}`),
    ...relationships
      .filter((r) => r.warnings.length)
      .slice(0, 3)
      .map((r) => `${r.leadMagnetName}: ${r.warnings[0]}`),
  ].slice(0, 8);

  return {
    generatedAt: new Date().toISOString(),
    offers: offerList,
    leadMagnets: magnetList,
    relationships,
    topOffersByConversion: sortDescBy(offerList, (o) => o.conversionRate).slice(0, 5),
    topOffersByLeadQuality: sortDescBy(offerList, (o) => o.leadQualityRate).slice(0, 5),
    topOffersByBookedCallRate: sortDescBy(offerList, (o) => o.bookedCallRate).slice(0, 5),
    topOffersByRevenue: sortDescBy(offerList, (o) => o.sales).slice(0, 5),
    highestValueMagnets: sortDescBy(magnetList, (m) => m.conversionRateAfterMagnet).slice(0, 5),
    lowIntentMagnets: magnetList
      .filter((m) => m.optIns >= 5)
      .sort((a, b) => a.leadQualityRate - b.leadQualityRate)
      .slice(0, 5),
    highIntentMagnets: sortDescBy(
      magnetList.filter((m) => m.optIns >= 3),
      (m) => m.leadQualityRate,
    ).slice(0, 5),
    weakJourneyChains: relationships
      .filter((r) => r.handoffScore < 45 || r.warnings.length > 0)
      .slice(0, 10),
    missingSupportingLeadMagnets,
    orphanLeadMagnets,
    topRecommendations,
  };
}

export async function inferOfferLeadMagnetAttributionForLead(args: {
  offerSlug?: string | null;
  leadMagnetSlug?: string | null;
  landingPage?: string | null;
  ppcCampaignId?: number | null;
}) {
  const normalizedOfferSlug = args.offerSlug?.trim().toLowerCase() || null;
  const normalizedMagnetSlug =
    args.leadMagnetSlug?.trim().toLowerCase() ||
    parseMagnetSlugFromPath(args.landingPage) ||
    null;

  let offerSlug = normalizedOfferSlug;
  if (!offerSlug && args.ppcCampaignId != null) {
    const [campaign] = await db
      .select({ offerSlug: ppcCampaigns.offerSlug })
      .from(ppcCampaigns)
      .where(eq(ppcCampaigns.id, args.ppcCampaignId))
      .limit(1);
    offerSlug = campaign?.offerSlug?.trim().toLowerCase() || null;
  }

  const offer = offerSlug ? await getOfferTemplateBySlug(offerSlug) : null;
  const leadMagnet = normalizedMagnetSlug
    ? await getLeadMagnetTemplateBySlug(normalizedMagnetSlug)
    : null;

  return {
    offerSlug: offer?.slug ?? offerSlug ?? null,
    leadMagnetSlug: leadMagnet?.slug ?? normalizedMagnetSlug ?? null,
  };
}

export async function toOfferLeadMagnetSnapshot(): Promise<OfferLeadMagnetIntelligenceSnapshot> {
  return buildOfferLeadMagnetIntelligence();
}

export async function buildOfferLeadMagnetIntelligenceSnapshot(
  input?: SnapshotFilterInput,
): Promise<
  OfferLeadMagnetIntelligenceSnapshot & {
    offerRows: OfferPerformance[];
    leadMagnetRows: LeadMagnetPerformance[];
  }
> {
  const filter = normalizeSnapshotFilterArgs(input);
  const base = await buildOfferLeadMagnetIntelligence();

  let offerSlugFromRelatedId: string | null = null;
  if (filter.relatedOfferTemplateId != null) {
    const offerTemplates = await listOfferTemplates();
    offerSlugFromRelatedId =
      offerTemplates.find((offer) => offer.id === filter.relatedOfferTemplateId)?.slug ?? null;
  }

  const offerSlugFilter = filter.offerTemplateSlug ?? offerSlugFromRelatedId;
  const leadMagnetSlugFilter = filter.leadMagnetTemplateSlug ?? null;
  const personaIdFilter = filter.personaId ?? null;

  const offers =
    offerSlugFilter || personaIdFilter
      ? base.offers.filter((offer) => {
          if (offerSlugFilter && offer.offerSlug !== offerSlugFilter) return false;
          if (!personaIdFilter) return true;
          return true;
        })
      : base.offers;

  const leadMagnets =
    leadMagnetSlugFilter || offerSlugFilter
      ? base.leadMagnets.filter((leadMagnet) => {
          if (leadMagnetSlugFilter && leadMagnet.leadMagnetSlug !== leadMagnetSlugFilter) return false;
          if (offerSlugFilter && leadMagnet.linkedOfferSlug && leadMagnet.linkedOfferSlug !== offerSlugFilter) {
            return false;
          }
          return true;
        })
      : base.leadMagnets;

  const relationships = base.relationships.filter((relationship) => {
    if (offerSlugFilter && relationship.offerSlug !== offerSlugFilter) return false;
    if (leadMagnetSlugFilter && relationship.leadMagnetSlug !== leadMagnetSlugFilter) return false;
    return true;
  });

  return {
    ...base,
    offers,
    leadMagnets,
    relationships,
    topOffersByConversion: sortDescBy(offers, (offer) => offer.conversionRate).slice(0, 5),
    topOffersByLeadQuality: sortDescBy(offers, (offer) => offer.leadQualityRate).slice(0, 5),
    topOffersByBookedCallRate: sortDescBy(offers, (offer) => offer.bookedCallRate).slice(0, 5),
    topOffersByRevenue: sortDescBy(offers, (offer) => offer.sales).slice(0, 5),
    highestValueMagnets: sortDescBy(leadMagnets, (leadMagnet) => leadMagnet.conversionRateAfterMagnet).slice(0, 5),
    lowIntentMagnets: [...leadMagnets]
      .filter((leadMagnet) => leadMagnet.optIns >= 5)
      .sort((a, b) => a.leadQualityRate - b.leadQualityRate)
      .slice(0, 5),
    highIntentMagnets: sortDescBy(
      leadMagnets.filter((leadMagnet) => leadMagnet.optIns >= 3),
      (leadMagnet) => leadMagnet.leadQualityRate,
    ).slice(0, 5),
    weakJourneyChains: relationships
      .filter((relationship) => relationship.handoffScore < 45 || relationship.warnings.length > 0)
      .slice(0, 10),
    offerRows: offers,
    leadMagnetRows: leadMagnets,
  };
}

export async function getOfferLeadMagnetIntelligenceSummary(): Promise<
  Pick<
    OfferLeadMagnetIntelligenceSnapshot,
    | "offers"
    | "leadMagnets"
    | "relationships"
    | "topOffersByConversion"
    | "weakJourneyChains"
    | "topRecommendations"
  >
> {
  const snapshot = await buildOfferLeadMagnetIntelligence();
  return {
    offers: snapshot.offers,
    leadMagnets: snapshot.leadMagnets,
    relationships: snapshot.relationships,
    topOffersByConversion: snapshot.topOffersByConversion,
    weakJourneyChains: snapshot.weakJourneyChains,
    topRecommendations: snapshot.topRecommendations,
  };
}

export async function getOfferLeadMagnetIntelligence(args: {
  offerSlug?: string | null;
  leadMagnetSlug?: string | null;
  trafficSource?: string | null;
  audienceTemperature?: string | null;
  personaId?: string | null;
}): Promise<OfferLeadMagnetIntelligenceResult> {
  const offerSlug = args.offerSlug?.trim().toLowerCase() ?? null;
  const leadMagnetSlug = args.leadMagnetSlug?.trim().toLowerCase() ?? null;

  const snapshot = await buildOfferLeadMagnetIntelligence();
  const offer = offerSlug ? snapshot.offers.find((row) => row.offerSlug === offerSlug) ?? null : null;
  const leadMagnet = leadMagnetSlug
    ? snapshot.leadMagnets.find((row) => row.leadMagnetSlug === leadMagnetSlug) ?? null
    : null;
  const scopedRelationships = snapshot.relationships.filter((relationship) => {
    if (offerSlug && relationship.offerSlug !== offerSlug) return false;
    if (leadMagnetSlug && relationship.leadMagnetSlug !== leadMagnetSlug) return false;
    return true;
  });

  const mismatchWarnings: string[] = [];
  if (args.audienceTemperature?.toLowerCase() === "cold" && offer && (offer.offerScore ?? 0) < 60) {
    mismatchWarnings.push("Cold traffic mapped to a weak offer score; improve clarity and proof before scale.");
  }
  if (offerSlug && leadMagnetSlug && scopedRelationships.length === 0) {
    mismatchWarnings.push("Selected offer and lead magnet have no proven journey linkage yet.");
  }
  if (offerSlug && leadMagnet?.linkedOfferSlug && leadMagnet.linkedOfferSlug !== offerSlug) {
    mismatchWarnings.push("Lead magnet is linked to a different offer; verify handoff flow.");
  }

  const warnings = uniqueStrings([
    ...(offer?.warnings ?? []),
    ...(leadMagnet?.warnings ?? []),
    ...scopedRelationships.flatMap((relationship) => relationship.warnings),
    ...mismatchWarnings,
  ]);

  const recommendations = uniqueStrings([
    ...scopedRelationships.flatMap((relationship) => relationship.recommendations),
    ...snapshot.topRecommendations,
  ]).slice(0, 8);

  const relationshipPool = scopedRelationships.length ? scopedRelationships : snapshot.relationships;
  const bestJourneyCombinations = sortDescBy(relationshipPool, (relationship) => relationship.handoffScore).slice(0, 5);
  const weakJourneyCombinations = [...relationshipPool]
    .sort((a, b) => a.handoffScore - b.handoffScore)
    .slice(0, 5);

  return {
    warnings,
    recommendations,
    mismatchWarnings,
    bestJourneyCombinations,
    weakJourneyCombinations,
  };
}

export async function getOfferLeadMagnetJourneyInsights(args: {
  offerSlug?: string | null;
  leadMagnetSlug?: string | null;
  trafficSource?: string | null;
  audienceTemperature?: string | null;
  personaId?: string | null;
}): Promise<{
  warningMessages: string[];
  recommendations: string[];
  mismatchWarnings: string[];
  bestJourneyCombinations: RelationshipInsight[];
  weakJourneyCombinations: RelationshipInsight[];
}> {
  const result = await getOfferLeadMagnetIntelligence(args);
  return {
    warningMessages: result.warnings,
    recommendations: result.recommendations,
    mismatchWarnings: result.mismatchWarnings,
    bestJourneyCombinations: result.bestJourneyCombinations,
    weakJourneyCombinations: result.weakJourneyCombinations,
  };
}

export async function buildOfferRelationshipSnapshot(offer: OfferEngineOfferTemplateRow): Promise<{
  linkedLeadMagnets: (LeadMagnetPerformance & { relationship: RelationshipInsight | null })[];
  suggestedLeadMagnets: (LeadMagnetPerformance & { rationale: string })[];
  missingLeadMagnetsForPersona: string[];
  relationshipWarnings: string[];
}> {
  const snapshot = await buildOfferLeadMagnetIntelligence();
  const linkedRelationships = snapshot.relationships.filter(
    (relationship) => relationship.offerSlug === offer.slug,
  );
  const linkedLeadMagnets = snapshot.leadMagnets
    .filter(
      (leadMagnet) =>
        leadMagnet.linkedOfferSlug === offer.slug ||
        linkedRelationships.some(
          (relationship) => relationship.leadMagnetSlug === leadMagnet.leadMagnetSlug,
        ),
    )
    .map((leadMagnet) => ({
      ...leadMagnet,
      relationship:
        linkedRelationships.find(
          (relationship) => relationship.leadMagnetSlug === leadMagnet.leadMagnetSlug,
        ) ?? null,
    }));

  const suggestedLeadMagnets = snapshot.leadMagnets
    .filter((leadMagnet) => !linkedLeadMagnets.some((linked) => linked.leadMagnetId === leadMagnet.leadMagnetId))
    .sort((a, b) => b.leadQualityRate - a.leadQualityRate)
    .slice(0, 3)
    .map((leadMagnet) => ({
      ...leadMagnet,
      rationale:
        leadMagnet.leadQualityRate >= 25
          ? "High intent quality signal from current traffic."
          : "Promising candidate to test as a challenger magnet.",
    }));

  const missingLeadMagnetsForPersona =
    linkedLeadMagnets.length === 0
      ? [`No lead magnets are currently linked to offer '${offer.slug}'.`]
      : [];
  const relationshipWarnings = uniqueStrings([
    ...linkedRelationships.flatMap((relationship) => relationship.warnings),
    ...missingLeadMagnetsForPersona,
  ]);

  return {
    linkedLeadMagnets,
    suggestedLeadMagnets,
    missingLeadMagnetsForPersona,
    relationshipWarnings,
  };
}

export async function computeOfferLeadMagnetIntelligence(
  _storage: unknown,
  args: {
    offerTemplateSlug?: string | null;
    leadMagnetTemplateSlug?: string | null;
  },
): Promise<{
  generatedAt: string;
  offer: OfferPerformance | null;
  leadMagnet: LeadMagnetPerformance | null;
  relationships: RelationshipInsight[];
  warnings: string[];
  recommendations: string[];
  mismatchWarnings: string[];
}> {
  const snapshot = await buildOfferLeadMagnetIntelligenceSnapshot({
    offerTemplateSlug: args.offerTemplateSlug ?? null,
    leadMagnetTemplateSlug: args.leadMagnetTemplateSlug ?? null,
  });
  const intelligence = await getOfferLeadMagnetIntelligence({
    offerSlug: args.offerTemplateSlug ?? null,
    leadMagnetSlug: args.leadMagnetTemplateSlug ?? null,
  });
  return {
    generatedAt: snapshot.generatedAt,
    offer: snapshot.offers[0] ?? null,
    leadMagnet: snapshot.leadMagnets[0] ?? null,
    relationships: snapshot.relationships,
    warnings: intelligence.warnings,
    recommendations: intelligence.recommendations,
    mismatchWarnings: intelligence.mismatchWarnings,
  };
}

export async function buildCampaignLaunchIntelligence(args: {
  offerSlug?: string | null;
  leadMagnetSlug?: string | null;
  landingPagePath?: string | null;
  trafficType?: string | null;
  personaId?: string | null;
}): Promise<{
  readinessMessages: string[];
  weaknessMessages: string[];
  recommendations: string[];
  mismatchWarnings: string[];
  offerIntelligence: OfferPerformance | null;
  leadMagnetIntelligence: LeadMagnetPerformance | null;
  relationshipInsight: RelationshipInsight | null;
}> {
  const snapshot = await buildOfferLeadMagnetIntelligence();
  const offerSlug = args.offerSlug?.trim().toLowerCase() ?? null;
  const leadMagnetSlug = args.leadMagnetSlug?.trim().toLowerCase() ?? null;
  const offerIntelligence = offerSlug
    ? snapshot.offers.find((offer) => offer.offerSlug === offerSlug) ?? null
    : null;
  const leadMagnetIntelligence = leadMagnetSlug
    ? snapshot.leadMagnets.find((leadMagnet) => leadMagnet.leadMagnetSlug === leadMagnetSlug) ?? null
    : null;
  const relationshipInsight =
    offerSlug && leadMagnetSlug
      ? snapshot.relationships.find(
          (relationship) =>
            relationship.offerSlug === offerSlug &&
            relationship.leadMagnetSlug === leadMagnetSlug,
        ) ?? null
      : offerSlug
        ? snapshot.relationships.find((relationship) => relationship.offerSlug === offerSlug) ?? null
        : null;

  const intelligence = await getOfferLeadMagnetIntelligence({
    offerSlug,
    leadMagnetSlug,
    audienceTemperature: args.trafficType ?? null,
    personaId: args.personaId ?? null,
  });

  const readinessMessages = uniqueStrings([
    relationshipInsight?.qualityVsVolume === "balanced"
      ? "Offer and lead magnet pair is balanced enough for launch testing."
      : "",
    args.landingPagePath?.trim() ? "Landing page route is configured." : "Landing page route is missing.",
  ]);
  const weaknessMessages = intelligence.warnings.slice(0, 6);

  return {
    readinessMessages,
    weaknessMessages,
    recommendations: intelligence.recommendations,
    mismatchWarnings: intelligence.mismatchWarnings,
    offerIntelligence,
    leadMagnetIntelligence,
    relationshipInsight,
  };
}

export async function getOfferEngineReadinessSnapshotForOfferSlug(
  _storage: unknown,
  offerSlug: string,
): Promise<{
  warnings: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const slug = offerSlug.trim().toLowerCase();
  const snapshot = await buildOfferLeadMagnetIntelligence();
  const offer = snapshot.offers.find((row) => row.offerSlug === slug) ?? null;
  const relationships = snapshot.relationships.filter((relationship) => relationship.offerSlug === slug);
  const weaknesses: string[] = [];
  if (!offer) {
    weaknesses.push("Offer slug is not mapped to an Offer Engine template.");
  } else {
    if ((offer.offerScore ?? 0) < 60) {
      weaknesses.push("Offer score is below launch-safe threshold (60).");
    }
    if (offer.leads > 0 && offer.bookedCallRate < 15) {
      weaknesses.push("Booked-call rate is weak relative to lead volume.");
    }
  }
  if (relationships.length === 0) {
    weaknesses.push("No lead magnet handoff relationships found for this offer.");
  }
  return {
    warnings: uniqueStrings([...(offer?.warnings ?? []), ...relationships.flatMap((relationship) => relationship.warnings)]),
    weaknesses,
    recommendations: uniqueStrings([
      ...relationships.flatMap((relationship) => relationship.recommendations),
      ...snapshot.topRecommendations,
    ]).slice(0, 8),
  };
}

export function buildOfferLeadMagnetDashboard(snapshot: OfferLeadMagnetIntelligenceSnapshot): {
  generatedAt: string;
  weakOfferCount: number;
  weakLeadMagnetCount: number;
  weakJourneyChainCount: number;
  topRecommendations: string[];
  topOffersByConversion: OfferPerformance[];
  highIntentMagnets: LeadMagnetPerformance[];
} {
  return {
    generatedAt: snapshot.generatedAt,
    weakOfferCount: snapshot.offers.filter((offer) => (offer.offerScore ?? 0) < 60).length,
    weakLeadMagnetCount: snapshot.leadMagnets.filter((leadMagnet) => (leadMagnet.leadMagnetScore ?? 0) < 60).length,
    weakJourneyChainCount: snapshot.weakJourneyChains.length,
    topRecommendations: snapshot.topRecommendations.slice(0, 8),
    topOffersByConversion: snapshot.topOffersByConversion.slice(0, 5),
    highIntentMagnets: snapshot.highIntentMagnets.slice(0, 5),
  };
}

