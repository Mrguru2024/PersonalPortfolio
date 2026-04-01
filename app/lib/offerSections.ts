/**
 * Shape of editable offer sections (stored in site_offers.sections).
 * Used by admin editor and public offer page.
 */

import { STARTUP_GROWTH_AUDIT_PRICE_RANGE } from "@/lib/servicePricing";

export interface OfferHero {
  title: string;
  subtitle: string;
  imageUrl?: string;
}

export interface OfferPrice {
  label: string;
  amount: string;
  note: string;
}

export interface OfferDeliverable {
  icon: string; // Lucide icon name, e.g. "FileText"
  title: string;
  desc: string;
  imageUrl?: string;
}

export interface OfferCta {
  buttonText: string;
  buttonHref: string;
  footnote: string;
}

/** How long the target reader has been in business (grading adjusts proof vs. education expectations). */
export type AudienceTenureBand =
  | "pre_launch"
  | "under_2_years"
  | "two_to_five_years"
  | "five_plus_years";

/** How invested they are in their vision (grading adjusts CTA strength and reassurance). */
export type AudienceVisionInvestment = "exploring" | "committed" | "all_in";

/**
 * Links a site offer to Ascendra IQ marketing personas (same ids as `marketing_personas.id`).
 * Stored in `site_offers.sections` for one JSON blob; **stripped** from public `GET /api/offers/[slug]`.
 */
export interface OfferIqTargeting {
  personaIds: string[];
  audienceTenureBand?: AudienceTenureBand;
  audienceVisionInvestment?: AudienceVisionInvestment;
}

export interface OfferSections {
  hero?: OfferHero;
  price?: OfferPrice;
  deliverables?: OfferDeliverable[];
  bullets?: string[];
  cta?: OfferCta;
  /** Optional graphics: banner, etc. */
  graphics?: { bannerUrl?: string; [key: string]: string | undefined };
  /**
   * Framework / intelligence: which personas this offer is written for (preview, grading, analytics).
   * Not exposed on the public site JSON.
   */
  iqTargeting?: OfferIqTargeting;
}

/** Remove admin-only keys before returning offer sections to visitors. */
export function stripOfferSectionsForPublic(
  sections: Record<string, unknown>
): Record<string, unknown> {
  const { iqTargeting: _iq, ...rest } = sections;
  return rest;
}

const TENURE_VALUES: AudienceTenureBand[] = [
  "pre_launch",
  "under_2_years",
  "two_to_five_years",
  "five_plus_years",
];

const VISION_VALUES: AudienceVisionInvestment[] = ["exploring", "committed", "all_in"];

function parseTenure(raw: unknown): AudienceTenureBand | undefined {
  return typeof raw === "string" && TENURE_VALUES.includes(raw as AudienceTenureBand)
    ? (raw as AudienceTenureBand)
    : undefined;
}

function parseVision(raw: unknown): AudienceVisionInvestment | undefined {
  return typeof raw === "string" && VISION_VALUES.includes(raw as AudienceVisionInvestment)
    ? (raw as AudienceVisionInvestment)
    : undefined;
}

/** Parse `iqTargeting` from stored JSON when loading the admin editor. */
export function parseOfferIqTargeting(raw: unknown): OfferIqTargeting | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const ids = o.personaIds;
  const personaIds = Array.isArray(ids)
    ? ids.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  const audienceTenureBand = parseTenure(o.audienceTenureBand);
  const audienceVisionInvestment = parseVision(o.audienceVisionInvestment);
  if (personaIds.length === 0 && !audienceTenureBand && !audienceVisionInvestment) return undefined;
  const out: OfferIqTargeting = { personaIds };
  if (audienceTenureBand) out.audienceTenureBand = audienceTenureBand;
  if (audienceVisionInvestment) out.audienceVisionInvestment = audienceVisionInvestment;
  return out;
}

export const DEFAULT_OFFER_SECTIONS: OfferSections = {
  hero: {
    title: "Startup growth system",
    subtitle:
      "A practical startup growth audit designed for founders who cannot yet afford a full agency build. Get clarity, a roadmap, and an actionable plan—without the big-ticket price.",
    imageUrl: "/stock images/Growth_11.jpeg",
  },
  graphics: {
    bannerUrl: "/stock images/Web Design_4.jpeg",
  },
  price: {
    label: "Price range",
    amount: STARTUP_GROWTH_AUDIT_PRICE_RANGE,
    note:
      "One-time audit and deliverable set. No ongoing retainer. You get the plan; you choose how to execute it.",
  },
  deliverables: [
    { icon: "FileText", title: "Website audit", desc: "Review of your current site: clarity, structure, conversion gaps, and trust signals." },
    { icon: "MessageSquare", title: "Messaging clarity suggestions", desc: "Concrete recommendations so your offer and audience are clear and consistent." },
    { icon: "Map", title: "Conversion improvement roadmap", desc: "Prioritized steps to improve lead capture and conversion without a full rebuild." },
    { icon: "Layout", title: "Page structure blueprint", desc: "A simple blueprint for your homepage (and key pages) so you know what to add or reorder." },
    { icon: "ClipboardList", title: "Actionable growth plan", desc: "A written plan you can follow step-by-step or hand to a freelancer or team." },
  ],
  bullets: [
    "No long-term commitment—one deliverable set.",
    "Clear, written output you can use yourself or hand to a freelancer.",
    "Focused on what matters most for early-stage growth.",
  ],
  cta: {
    buttonText: "Get startup growth system",
    buttonHref: "/strategy-call",
    footnote: "You'll be taken to book a short call. We'll confirm scope and next steps—no pressure.",
  },
};
