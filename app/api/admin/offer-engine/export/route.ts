import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { getOfferTemplate, getLeadMagnetTemplate } from "@server/services/offerEngineService";
import { getMarketingPersona } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
        pricingPackage: offer.pricingPackageJson ?? null,
      };
      if (format === "crm") {
        const c = offer.pricingPackageJson?.computed;
        const crm = {
          type: "ascendra_offer_snapshot",
          source: "offer_engine",
          templateId: offer.id,
          slug: offer.slug,
          name: offer.name,
          personaId: offer.personaId,
          tierFocus: offer.pricingPackageJson?.tierFocus ?? null,
          validationStatus: offer.pricingPackageJson?.validationStatus ?? null,
          suggestedSetupUsd: c?.suggestedSetupUsd ?? null,
          suggestedMonthlyUsd: c?.suggestedMonthlyUsd ?? null,
          suggestedDwyUsd: c?.suggestedDwyOneTimeUsd ?? null,
          suggestedDiyUsd: c?.suggestedDiyUsd ?? null,
          modeledMonthlyRevenue: c?.projectedMonthlyRevenue ?? null,
          modeledAnnualRevenue: c?.projectedAnnualRevenue ?? null,
          coreResult: c?.outcomeStatementSnippet ?? null,
          positioning: c?.autoPositioningStatement ?? null,
          disclaimer: c?.legalDisclaimerEffective ?? null,
          stripeProductId: offer.pricingPackageJson?.inputs?.stripeProductId ?? null,
          stripePriceIdSetup: offer.pricingPackageJson?.inputs?.stripePriceIdSetup ?? null,
          stripePriceIdMonthly: offer.pricingPackageJson?.inputs?.stripePriceIdMonthly ?? null,
        };
        return NextResponse.json(crm);
      }
      if (format === "html") {
        const c = offer.pricingPackageJson?.computed;
        const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(offer.name)} — Offer snapshot</title>
<style>
body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#111;}
h1{font-size:1.35rem;border-bottom:1px solid #ddd;padding-bottom:.5rem;}
section{margin-top:1.25rem;}
.muted{color:#555;font-size:0.9rem;}
.tag{display:inline-block;background:#eee;padding:.2rem .5rem;border-radius:4px;font-size:0.75rem;margin-right:.35rem;}
</style></head><body>
<h1>${escapeHtml(offer.name)}</h1>
<p class="muted">Persona: ${escapeHtml(persona?.displayName ?? offer.personaId)} · Slug: ${escapeHtml(offer.slug)}</p>
${c ? `<section><h2>Value model</h2><p>Modeled monthly volume: <strong>$${(c.projectedMonthlyRevenue ?? 0).toLocaleString()}</strong></p>
<p>Modeled annual: <strong>$${(c.projectedAnnualRevenue ?? 0).toLocaleString()}</strong></p>
${c.breakEvenMonthsVsPrice != null ? `<p>Break-even vs first invoice (modeled): <strong>${c.breakEvenMonthsVsPrice.toFixed(1)} months</strong></p>` : ""}
</section>
<section><h2>Suggested pricing (USD)</h2>
<p>DFY setup: <strong>$${(c.suggestedSetupUsd ?? 0).toLocaleString()}</strong> · Monthly: <strong>$${(c.suggestedMonthlyUsd ?? 0).toLocaleString()}</strong></p>
<p>DWY (one-time guide): <strong>$${(c.suggestedDwyOneTimeUsd ?? 0).toLocaleString()}</strong></p>
<p>DIY: <strong>$${(c.suggestedDiyUsd ?? 0).toLocaleString()}</strong></p></section>
<section><h2>Positioning</h2><p>${escapeHtml(c.autoPositioningStatement ?? "")}</p></section>
<section><h2>Disclaimer</h2><p class="muted">${escapeHtml(c.legalDisclaimerEffective ?? "")}</p></section>` : "<p class=\"muted\">No pricing package on this template.</p>"}
<p class="muted" style="margin-top:2rem;">Generated by Ascendra Offer Engine · ${new Date().toISOString()}</p>
</body></html>`;
        return new NextResponse(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      if (format === "text") {
        const pp = offer.pricingPackageJson;
        const c = pp?.computed;
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
          c ?
            [
              ``,
              `--- Pricing & value ---`,
              `Tier focus: ${pp?.tierFocus ?? "—"}`,
              `Validation: ${pp?.validationStatus ?? "—"}`,
              `Modeled monthly revenue: $${(c.projectedMonthlyRevenue ?? 0).toLocaleString()}`,
              `Suggested setup / monthly: $${(c.suggestedSetupUsd ?? 0).toLocaleString()} / $${(c.suggestedMonthlyUsd ?? 0).toLocaleString()}`,
              `Positioning: ${c.autoPositioningStatement ?? ""}`,
            ].join("\n")
          : "",
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
