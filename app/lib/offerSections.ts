/**
 * Shape of editable offer sections (stored in site_offers.sections).
 * Used by admin editor and public offer page.
 */

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

export interface OfferSections {
  hero?: OfferHero;
  price?: OfferPrice;
  deliverables?: OfferDeliverable[];
  bullets?: string[];
  cta?: OfferCta;
  /** Optional graphics: banner, etc. */
  graphics?: { bannerUrl?: string; [key: string]: string | undefined };
}

export const DEFAULT_OFFER_SECTIONS: OfferSections = {
  hero: {
    title: "Startup growth system",
    subtitle:
      "A practical startup growth audit designed for founders who cannot yet afford a full agency build. Get clarity, a roadmap, and an actionable plan—without the big-ticket price.",
  },
  price: {
    label: "Price range",
    amount: "$249 – $399",
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
