/**
 * Offer Engine ↔ PPC, funnel paths, and CRM (Phase 1 integration — no duplicate scoring engines).
 */
import type { IStorage } from "@server/storage";
import type { OfferEngineFunnelPathRow, OfferEngineOfferTemplateRow } from "@shared/offerEngineSchema";
import {
  getLeadMagnetTemplate,
  getOfferTemplate,
  getOfferTemplateBySlug,
} from "./offerEngineService";

export async function resolveSiteOfferWithEngineTemplate(
  offerSlug: string | null | undefined,
  storage: IStorage,
): Promise<{
  siteOffer: Awaited<ReturnType<IStorage["getSiteOffer"]>>;
  engineTemplate: OfferEngineOfferTemplateRow | null;
}> {
  const slug = offerSlug?.trim();
  if (!slug) return { siteOffer: undefined, engineTemplate: null };
  const siteOffer = await storage.getSiteOffer(slug);
  if (!siteOffer) return { siteOffer: undefined, engineTemplate: null };
  const engineSlug = siteOffer.offerEngineTemplateSlug?.trim();
  if (!engineSlug) return { siteOffer, engineTemplate: null };
  const engineTemplate = await getOfferTemplateBySlug(engineSlug);
  return { siteOffer, engineTemplate };
}

/**
 * Blend “site offer exists” confidence with Offer Engine template quality when linked.
 */
export function offerClarityScoreForPpc(input: {
  siteOfferExists: boolean;
  engineOverall: number | null;
}): number {
  if (!input.siteOfferExists) return 40;
  if (input.engineOverall == null) return 88;
  const blended = Math.round(0.32 * 88 + 0.68 * input.engineOverall);
  return Math.min(100, Math.max(38, blended));
}

export function offerEngineSignalsForPpcCampaign(
  engineTemplate: OfferEngineOfferTemplateRow | null,
): string[] {
  const signals: string[] = [];
  if (!engineTemplate) return signals;
  const overall = engineTemplate.scoreCacheJson?.overall;
  if (overall != null && overall < 55) {
    signals.push(
      `Linked Offer Engine template "${engineTemplate.name}" scores ${overall}/100 — refine promise, proof, and funnel alignment before scaling cold traffic.`,
    );
  }
  const msgs = engineTemplate.warningsJson?.messages ?? [];
  for (const m of msgs.slice(0, 5)) {
    if (m.trim()) signals.push(m);
  }
  return signals;
}

export type FunnelPathReadiness = {
  level: "ok" | "warning";
  messages: string[];
};

export async function computeFunnelPathReadiness(
  row: OfferEngineFunnelPathRow,
): Promise<FunnelPathReadiness> {
  const messages: string[] = [];
  let level: FunnelPathReadiness["level"] = "ok";

  if (!row.primaryOfferTemplateId) {
    messages.push("No primary offer template on this funnel path.");
    level = "warning";
  }
  if (!row.primaryLeadMagnetTemplateId) {
    messages.push("No primary lead magnet template on this funnel path.");
    level = "warning";
  }

  const offer = row.primaryOfferTemplateId
    ? await getOfferTemplate(row.primaryOfferTemplateId)
    : null;
  const magnet = row.primaryLeadMagnetTemplateId
    ? await getLeadMagnetTemplate(row.primaryLeadMagnetTemplateId)
    : null;

  if (offer?.scoreCacheJson?.overall != null && offer.scoreCacheJson.overall < 55) {
    messages.push(
      `Primary offer "${offer.name}" scores ${offer.scoreCacheJson.overall}/100 — improve before cold acquisition.`,
    );
    level = "warning";
  }
  if (magnet?.scoreCacheJson?.overall != null && magnet.scoreCacheJson.overall < 55) {
    messages.push(
      `Primary lead magnet "${magnet.name}" scores ${magnet.scoreCacheJson.overall}/100 — strengthen hook and next-step clarity.`,
    );
    level = "warning";
  }

  if (offer && magnet && offer.personaId !== magnet.personaId) {
    messages.push(
      "Offer template and lead magnet use different personas — verify messaging and handoff.",
    );
    level = "warning";
  }

  return { level, messages };
}
