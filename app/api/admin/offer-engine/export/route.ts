import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOfferTemplate, getLeadMagnetTemplate } from "@server/services/offerEngineService";
import { getMarketingPersona } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/offer-engine/export?type=offer|lead_magnet&id= */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const idRaw = searchParams.get("id");
    const format = searchParams.get("format") ?? "json";
    if (!type || !idRaw) {
      return NextResponse.json({ error: "type and id required" }, { status: 400 });
    }
    const id = Number(idRaw);
    if (!Number.isFinite(id) || id < 1) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    if (type === "offer") {
      const offer = await getOfferTemplate(id);
      if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const persona = await getMarketingPersona(offer.personaId);
      const payload = {
        kind: "offer_template" as const,
        persona: persona?.displayName ?? offer.personaId,
        businessType: persona?.segment,
        problem: offer.coreProblem,
        desiredOutcome: offer.desiredOutcome,
        whyNow: offer.perceivedOutcomeReviewJson.whyNowStatement,
        trustTrigger: offer.trustBuilderType,
        promise: offer.primaryPromise,
        deliverables: offer.tangibleDeliverables,
        offerType: offer.offerType,
        cta: offer.ctaGoal,
        bridgeNotes: offer.strategyWhyConvertJson,
        score: offer.scoreCacheJson,
        weaknesses: offer.scoreCacheJson?.weaknesses ?? [],
        recommendations: offer.scoreCacheJson?.recommendedFixes ?? [],
        funnelPath: offer.funnelAlignmentJson,
        warnings: offer.warningsJson,
        copyBlocks: offer.copyBlocksJson,
      };
      if (format === "text") {
        const text = [
          `Ascendra Offer Engine — Offer export`,
          `Persona: ${payload.persona}`,
          `Problem: ${payload.problem ?? ""}`,
          `Desired outcome: ${payload.desiredOutcome ?? ""}`,
          `Promise: ${payload.promise ?? ""}`,
          `CTA: ${payload.cta}`,
          `Score: ${payload.score?.overall ?? "—"} (${payload.score?.tier ?? ""})`,
          `Weaknesses: ${(payload.weaknesses ?? []).join("; ")}`,
          `Recommendations: ${(payload.recommendations ?? []).join("; ")}`,
          ``,
          JSON.stringify(payload.funnelPath, null, 2),
        ].join("\n");
        return new NextResponse(text, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return NextResponse.json(payload);
    }

    if (type === "lead_magnet") {
      const lm = await getLeadMagnetTemplate(id);
      if (!lm) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const persona = await getMarketingPersona(lm.personaId);
      const payload = {
        kind: "lead_magnet_template" as const,
        persona: persona?.displayName ?? lm.personaId,
        businessType: persona?.segment,
        problem: lm.bigProblem,
        desiredOutcome: lm.smallQuickWin,
        hook: lm.promiseHook,
        magnetType: lm.leadMagnetType,
        bridge: lm.bridgeToPaidJson,
        score: lm.scoreCacheJson,
        weaknesses: lm.scoreCacheJson?.weaknesses ?? [],
        recommendations: lm.scoreCacheJson?.recommendedFixes ?? [],
        funnelPath: lm.funnelAlignmentJson,
        warnings: lm.warningsJson,
        copyBlocks: lm.copyBlocksJson,
      };
      if (format === "text") {
        const text = [
          `Ascendra Offer Engine — Lead magnet export`,
          `Persona: ${payload.persona}`,
          `Hook: ${payload.hook ?? ""}`,
          `Quick win: ${payload.desiredOutcome ?? ""}`,
          `Score: ${payload.score?.overall ?? "—"} (${payload.score?.tier ?? ""})`,
          ``,
          JSON.stringify(payload.bridge, null, 2),
        ].join("\n");
        return new NextResponse(text, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return NextResponse.json(payload);
    }

    return NextResponse.json({ error: "type must be offer or lead_magnet" }, { status: 400 });
  } catch (e) {
    console.error("[GET offer-engine/export]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
