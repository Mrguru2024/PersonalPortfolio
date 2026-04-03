/**
 * Ascendra OS — canonical model for Offer Engine vs related systems (Phase 1 integration doc).
 *
 * **site_offers** — Public-facing pages and `/api/offers/[slug]`. Optional `offer_engine_template_slug`
 * links a live offer to an internal **offer_engine_offer_templates** row for pricing snapshot merge.
 *
 * **offer_engine_offer_templates** — Admin-only strategy templates (persona, promise, funnel,
 * scoring, warnings). This is the primary place to extend Grand Slam–style structure.
 *
 * **offer_engine_lead_magnet_templates** — Lead magnet templates with `related_offer_template_id`.
 * Distinct from **ascendra_lead_magnets** (IQ library): IQ rows are lighter; Offer Engine templates
 * drive scoring, warnings, and PPC/funnel readiness when linked.
 *
 * **offer_engine_funnel_paths** — Persona journey steps + optional primary offer/magnet template IDs.
 *
 * **Offer valuation (`offer_valuations`, `/offer-audit`)** — Value equation sessions (1–10 inputs,
 * log-normalized score). Unified 0–100 + Hormozi-style rating labels live in `shared/offerValuation.ts`
 * via `analyzeValueEquation` so public tools and admin see one scale story.
 */

export const OFFER_ENGINE_CANONICAL_MODEL_VERSION = "1.0.0" as const;
