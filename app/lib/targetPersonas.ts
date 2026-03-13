/**
 * Target personas for services – used across main page, nav, and promos
 * so users get a clear path based on their needs.
 */

export type PersonaId = "contractors-trades" | "general";

export interface TargetPersona {
  id: PersonaId;
  label: string;
  shortLabel: string;
  description: string;
  /** Primary CTA for this persona */
  ctaLabel: string;
  /** Where the CTA goes */
  href: string;
  /** For nav / "Who is this for?" sections */
  ariaLabel?: string;
}

/** Contractors & trades: electricians, HVAC, plumbers, locksmiths, roofing, local service. Funnel: landing → audit → strategy call. */
export const CONTRACTORS_TRADES_PERSONA: TargetPersona = {
  id: "contractors-trades",
  label: "Contractors & trades businesses",
  shortLabel: "Contractors & trades",
  description:
    "Electricians, HVAC, plumbers, locksmiths, security installers, roofing companies, and other local service businesses that want more calls and qualified leads from their website.",
  ctaLabel: "Get your free website growth audit",
  href: "/contractor-systems",
  ariaLabel: "For contractors and trades: free website growth audit",
};

/** General: start a project, get a quote, assessment, or contact. */
export const GENERAL_PERSONA: TargetPersona = {
  id: "general",
  label: "Businesses & individuals starting a project",
  shortLabel: "Start a project",
  description:
    "Anyone looking for custom web development, design, or a tailored quote for their next project.",
  ctaLabel: "Start a Project",
  href: "/contact",
  ariaLabel: "Start a project or get in touch",
};

export const TARGET_PERSONAS: TargetPersona[] = [
  CONTRACTORS_TRADES_PERSONA,
  GENERAL_PERSONA,
];
