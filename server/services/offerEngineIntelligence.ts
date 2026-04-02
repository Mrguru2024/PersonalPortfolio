import { and, desc, gte, inArray, sql } from "drizzle-orm";
import { db } from "@server/db";
import {
  crmContacts,
  crmDeals,
  offerEngineFunnelPaths,
  offerEngineLeadMagnetTemplates,
  offerEngineOfferTemplates,
  ppcCampaigns,
  ppcCampaignDestinations,
  visitorActivity,
  type OfferEngineLeadMagnetTemplateRow,
  type OfferEngineOfferTemplateRow,
} from "@shared/schema";
import type { LeadMagnetBuilderResult, LeadMagnetGraderResult, OfferGraderResult } from "@shared/offerEngineTypes";
import { buildLeadMagnetResult, gradeLeadMagnet, gradeOffer } from "./offerEngineScoring";
import { getScarcityBlockedCampaignSummaries, getFunnelScarcityReadinessSignals } from "@modules/scarcity-engine";

function rateLabel(n: number): "weak" | "average" | "strong" {
  if (n < 45) return "weak";
  if (n < 70) return "average";
  return "strong";
}

export async function computeOfferTemplatePerformance(offer: OfferEngineOfferTemplateRow) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const leadRows = await db
    .select({
      id: crmContacts.id,
      leadScore: crmContacts.leadScore,
      sourceOfferSlug: crmContacts.sourceOfferSlug,
      customFields: crmContacts.customFields,
      createdAt: crmContacts.createdAt,
    })
    .from(crmContacts)
    .where(
      and(
        gte(crmContacts.createdAt, thirtyDaysAgo),
        sql`(
          ${crmContacts.sourceOfferSlug} = ${offer.slug}
          OR (${crmContacts.customFields} ->> 'offerTemplateSlug') = ${offer.slug}
          OR (${crmContacts.customFields} ->> 'offerSlug') = ${offer.slug}
        )`,
      ),
    );

  const leadIds = leadRows.map((r) => r.id);
  let wonDeals = 0;
  let totalDeals = 0;
  if (leadIds.length) {
    const dealRows = await db
      .select({
        id: crmDeals.id,
        stage: crmDeals.pipelineStage,
      })
      .from(crmDeals)
      .where(inArray(crmDeals.contactId, leadIds));
    totalDeals = dealRows.length;
    wonDeals = dealRows.filter((d) => d.stage === "won").length;
  }

  const avgLeadScore =
    leadRows.length > 0
      ? Math.round(
          leadRows.reduce((sum, r) => sum + Number(r.leadScore ?? 0), 0) /
            Math.max(1, leadRows.filter((r) => Number.isFinite(Number(r.leadScore))).length),
        )
      : 0;

  const conversionRate = leadRows.length ? Math.round((wonDeals / leadRows.length) * 100) : 0;
  const bookedCallRate = Math.min(100, Math.round((leadRows.filter((r) => Number(r.leadScore ?? 0) >= 65).length / Math.max(1, leadRows.length)) * 100));

  return {
    leadCount30d: leadRows.length,
    dealCount30d: totalDeals,
    wonCount30d: wonDeals,
    conversionRate30d: conversionRate,
    bookedCallRate30d: bookedCallRate,
    avgLeadScore30d: avgLeadScore,
  };
}

export async function computeLeadMagnetTemplatePerformance(leadMagnet: OfferEngineLeadMagnetTemplateRow) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      eventType: visitorActivity.eventType,
      metadata: visitorActivity.metadata,
      leadId: visitorActivity.leadId,
    })
    .from(visitorActivity)
    .where(
      and(
        gte(visitorActivity.createdAt, thirtyDaysAgo),
        sql`(
          (${visitorActivity.metadata} ->> 'leadMagnetTemplateSlug') = ${leadMagnet.slug}
          OR (${visitorActivity.metadata} ->> 'lead_magnet_slug') = ${leadMagnet.slug}
          OR (${visitorActivity.metadata} ->> 'leadMagnetSlug') = ${leadMagnet.slug}
        )`,
      ),
    );

  const views = rows.filter((r) => r.eventType === "page_view").length;
  const optIns = rows.filter((r) => r.eventType === "form_submit" || r.eventType === "lead_magnet_download").length;
  const nextStepClicks = rows.filter((r) => r.eventType === "cta_click" || r.eventType === "booking_click").length;
  const uniqueLeads = new Set(rows.map((r) => r.leadId).filter((x): x is number => typeof x === "number")).size;

  return {
    views30d: views,
    optIns30d: optIns,
    nextStepClicks30d: nextStepClicks,
    leadCount30d: uniqueLeads,
    optInRate30d: views ? Math.round((optIns / views) * 100) : 0,
    nextStepRate30d: optIns ? Math.round((nextStepClicks / optIns) * 100) : 0,
  };
}

export async function buildOfferEngineRelationshipInsights() {
  const [offers, leadMagnets, funnelPaths, campaignRows, destinationRows] = await Promise.all([
    db.select().from(offerEngineOfferTemplates),
    db.select().from(offerEngineLeadMagnetTemplates),
    db.select().from(offerEngineFunnelPaths),
    db.select().from(ppcCampaigns),
    db.select().from(ppcCampaignDestinations),
  ]);

  const lmByOffer = new Map<number, OfferEngineLeadMagnetTemplateRow[]>();
  for (const lm of leadMagnets) {
    if (!lm.relatedOfferTemplateId) continue;
    const list = lmByOffer.get(lm.relatedOfferTemplateId) ?? [];
    list.push(lm);
    lmByOffer.set(lm.relatedOfferTemplateId, list);
  }

  const offerToCampaignCount = new Map<string, number>();
  for (const c of campaignRows) {
    if (c.offerSlug?.trim()) {
      offerToCampaignCount.set(c.offerSlug.trim(), (offerToCampaignCount.get(c.offerSlug.trim()) ?? 0) + 1);
    }
  }
  for (const d of destinationRows) {
    if (d.offerSlug?.trim()) {
      offerToCampaignCount.set(d.offerSlug.trim(), (offerToCampaignCount.get(d.offerSlug.trim()) ?? 0) + 1);
    }
  }

  const offersMissingLeadMagnets: string[] = [];
  const offerMagnetMatches: Array<{
    offerSlug: string;
    leadMagnetSlug: string;
    relationshipStrength: "weak" | "average" | "strong";
    warnings: string[];
  }> = [];

  for (const offer of offers) {
    const related = lmByOffer.get(offer.id) ?? [];
    if (related.length === 0) offersMissingLeadMagnets.push(offer.slug);

    for (const lm of related) {
      const warnings: string[] = [];
      const samePersona = offer.personaId === lm.personaId;
      if (!samePersona) warnings.push("Persona mismatch between lead magnet and offer.");
      if (!lm.bridgeToPaidJson.paidStepItPointsTo?.trim()) warnings.push("Lead magnet lacks clear paid-step bridge.");
      if (!lm.funnelAlignmentJson.followUpAction?.trim()) warnings.push("Lead magnet follow-up action is unclear.");
      const score = [
        samePersona ? 35 : 10,
        lm.scoreCacheJson?.overall ? Math.round(lm.scoreCacheJson.overall * 0.3) : 12,
        offer.scoreCacheJson?.overall ? Math.round(offer.scoreCacheJson.overall * 0.3) : 12,
      ].reduce((a, b) => a + b, 0);
      offerMagnetMatches.push({
        offerSlug: offer.slug,
        leadMagnetSlug: lm.slug,
        relationshipStrength: rateLabel(score),
        warnings,
      });
    }
  }

  const leadMagnetsWithoutOffer = leadMagnets.filter((lm) => !lm.relatedOfferTemplateId).map((lm) => lm.slug);
  const coldTrafficWeakOfferWarnings = campaignRows
    .filter((c) => {
      const lowIntent = (c.objective ?? "").toLowerCase().includes("traffic");
      if (!lowIntent || !c.offerSlug?.trim()) return false;
      const offer = offers.find((o) => o.slug === c.offerSlug?.trim());
      return !offer || (offer.scoreCacheJson?.overall ?? 0) < 62;
    })
    .map((c) => `Campaign "${c.name}" sends likely cold traffic to weak/unscored offer "${c.offerSlug ?? "unknown"}".`);

  const funnelPathWarnings = funnelPaths.flatMap((fp) => {
    const list: string[] = [];
    if (!fp.primaryOfferTemplateId) list.push(`${fp.slug}: no primary offer attached.`);
    if (!fp.primaryLeadMagnetTemplateId) list.push(`${fp.slug}: no primary lead magnet attached.`);
    if (fp.primaryOfferTemplateId && fp.primaryLeadMagnetTemplateId) {
      const lm = leadMagnets.find((x) => x.id === fp.primaryLeadMagnetTemplateId);
      const offer = offers.find((x) => x.id === fp.primaryOfferTemplateId);
      if (lm && offer && lm.personaId !== offer.personaId) {
        list.push(`${fp.slug}: offer and lead magnet persona mismatch.`);
      }
    }
    return list;
  });

  return {
    totals: {
      offers: offers.length,
      leadMagnets: leadMagnets.length,
      funnelPaths: funnelPaths.length,
      linkedOfferMagnetPairs: offerMagnetMatches.length,
    },
    offersMissingLeadMagnets,
    leadMagnetsWithoutOffer,
    offerMagnetMatches,
    funnelPathWarnings,
    coldTrafficWeakOfferWarnings,
    campaignLinksByOffer: Array.from(offerToCampaignCount.entries()).map(([offerSlug, campaigns]) => ({
      offerSlug,
      campaigns,
    })),
  };
}

export async function buildOfferAndLeadMagnetGradingRows() {
  const [offers, leadMagnets] = await Promise.all([
    db.select().from(offerEngineOfferTemplates),
    db.select().from(offerEngineLeadMagnetTemplates),
  ]);

  const offerRows: Array<{
    offerId: number;
    slug: string;
    name: string;
    grader: OfferGraderResult;
  }> = [];
  for (const offer of offers) {
    offerRows.push({
      offerId: offer.id,
      slug: offer.slug,
      name: offer.name,
      grader: gradeOffer(offer),
    });
  }

  const lmRows: Array<{
    leadMagnetId: number;
    slug: string;
    name: string;
    builder: LeadMagnetBuilderResult;
    grader: LeadMagnetGraderResult;
  }> = [];
  for (const lm of leadMagnets) {
    lmRows.push({
      leadMagnetId: lm.id,
      slug: lm.slug,
      name: lm.name,
      builder: buildLeadMagnetResult(lm, null),
      grader: gradeLeadMagnet(lm, null),
    });
  }

  return {
    offers: offerRows,
    leadMagnets: lmRows,
  };
}

export async function getOfferEngineFunnelReadinessSignals() {
  const topWeak = await db
    .select({
      id: offerEngineOfferTemplates.id,
      slug: offerEngineOfferTemplates.slug,
      name: offerEngineOfferTemplates.name,
      score: sql<number>`coalesce((${offerEngineOfferTemplates.scoreCacheJson} ->> 'overall')::int, 0)`,
    })
    .from(offerEngineOfferTemplates)
    .orderBy(sql`coalesce((${offerEngineOfferTemplates.scoreCacheJson} ->> 'overall')::int, 0) asc`)
    .limit(5);

  const weakLeadMagnets = await db
    .select({
      id: offerEngineLeadMagnetTemplates.id,
      slug: offerEngineLeadMagnetTemplates.slug,
      name: offerEngineLeadMagnetTemplates.name,
      score: sql<number>`coalesce((${offerEngineLeadMagnetTemplates.scoreCacheJson} ->> 'overall')::int, 0)`,
    })
    .from(offerEngineLeadMagnetTemplates)
    .orderBy(sql`coalesce((${offerEngineLeadMagnetTemplates.scoreCacheJson} ->> 'overall')::int, 0) asc`)
    .limit(5);

  const ppcRows = await db
    .select({
      id: ppcCampaigns.id,
      name: ppcCampaigns.name,
      offerSlug: ppcCampaigns.offerSlug,
      readinessScore: ppcCampaigns.readinessScore,
    })
    .from(ppcCampaigns)
    .orderBy(desc(ppcCampaigns.updatedAt))
    .limit(20);

  const weakCampaigns = ppcRows
    .filter((r) => Number(r.readinessScore ?? 0) < 65)
    .map((r) => ({
      id: r.id,
      name: r.name,
      offerSlug: r.offerSlug,
      readinessScore: Number(r.readinessScore ?? 0),
    }));

  const scarcityReadiness = await getFunnelScarcityReadinessSignals().catch(() => []);
  const scarcityBlockedCampaigns = await getScarcityBlockedCampaignSummaries().catch(() => []);
  return {
    weakOffers: topWeak,
    weakLeadMagnets,
    weakCampaigns,
    scarcityReadiness,
    scarcityBlockedCampaigns,
  };
}

export async function getOfferEngineReadinessAlerts() {
  return getOfferEngineFunnelReadinessSignals();
}
