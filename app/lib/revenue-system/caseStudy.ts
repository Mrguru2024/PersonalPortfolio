import type { CaseStudyBlock, CaseStudyFormats, CaseStudySectionContent } from "@shared/schema";

export const CASE_STUDY_PUBLISH_STATES = [
  "draft",
  "preview",
  "published",
  "archived",
] as const;

export const CASE_STUDY_PERSONAS = ["trades", "freelancers", "founders", "operators"] as const;

export const CASE_STUDY_SYSTEMS = [
  "lead_system",
  "authority_system",
  "validation_funnel",
  "revenue_system",
] as const;

export type CaseStudyPersona = (typeof CASE_STUDY_PERSONAS)[number];
export type CaseStudySystem = (typeof CASE_STUDY_SYSTEMS)[number];

export function slugifyCaseStudy(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function emptyCaseStudySections(): CaseStudySectionContent {
  return {
    hero: "",
    overview: "",
    problem: "",
    diagnosis: "",
    solution: "",
    results: "",
    visualProof: "",
    takeaways: "",
    cta: "",
  };
}

export function computeCaseStudyCompleteness(input: {
  sections: CaseStudySectionContent;
  blocks: CaseStudyBlock[];
  ctaLabel?: string | null;
  ctaHref?: string | null;
}): number {
  const hasProblem = input.sections.problem.trim().length > 30;
  const hasSolution = input.sections.solution.trim().length > 30;
  const hasResults = input.sections.results.trim().length > 20;
  const hasVisuals =
    input.sections.visualProof.trim().length > 10 ||
    input.blocks.some(
      (block) =>
        block.type === "image" ||
        block.type === "gallery" ||
        block.type === "before_after" ||
        block.type === "metrics_card",
    );
  const hasCta =
    (input.ctaLabel ?? "").trim().length > 0 ||
    (input.ctaHref ?? "").trim().length > 0 ||
    input.sections.cta.trim().length > 0 ||
    input.blocks.some((block) => block.type === "cta_block");

  const score =
    (hasProblem ? 20 : 0) +
    (hasSolution ? 20 : 0) +
    (hasResults ? 20 : 0) +
    (hasVisuals ? 20 : 0) +
    (hasCta ? 20 : 0);

  return Math.max(0, Math.min(100, score));
}

function formatSection(title: string, content: string): string {
  return `${title}\n${content.trim() || "TBD"}\n`;
}

export function generateCaseStudyFormats(input: {
  title: string;
  summary: string;
  sections: CaseStudySectionContent;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}): CaseStudyFormats {
  const title = input.title.trim() || "Untitled Case Study";
  const summary = input.summary.trim();
  const ctaLabel = (input.ctaLabel ?? "").trim() || "Book Strategy Call";
  const ctaHref = (input.ctaHref ?? "").trim() || "/strategy-call";

  const full = [
    title,
    summary,
    formatSection("Problem", input.sections.problem),
    formatSection("Diagnosis", input.sections.diagnosis),
    formatSection("Solution", input.sections.solution),
    formatSection("Results", input.sections.results),
    formatSection("Takeaways", input.sections.takeaways),
    `CTA: ${ctaLabel} (${ctaHref})`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const short = `${title}: ${summary || input.sections.overview || input.sections.problem || "Transformation delivered with measurable improvements."}`;
  const social = `Proof in action: ${title}. ${input.sections.results || summary || "System changes delivered measurable wins."} ${ctaLabel} → ${ctaHref}`;
  const email = `Subject: ${title}\n\n${summary || input.sections.overview}\n\nProblem: ${input.sections.problem}\nSolution: ${input.sections.solution}\nResults: ${input.sections.results}\n\n${ctaLabel}: ${ctaHref}`;
  const proposal = `Case proof: ${title}\n\nChallenge: ${input.sections.problem}\nApproach: ${input.sections.solution}\nOutcome: ${input.sections.results}\n`;
  const landingProof = `Results Snapshot — ${title}\n${input.sections.results || input.sections.visualProof || summary}\nCTA: ${ctaLabel}`;

  return { full, short, social, email, proposal, landingProof };
}

export interface SeedCaseStudyDraft {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  persona: CaseStudyPersona;
  recommendedSystem: CaseStudySystem;
  sections: CaseStudySectionContent;
  ctaLabel: string;
  ctaHref: string;
}

export const DEFAULT_CASE_STUDY_DRAFTS: SeedCaseStudyDraft[] = [
  {
    slug: "service-business-booking-system",
    title: "How a Service Business Stopped Losing Jobs and Started Booking Consistently",
    subtitle: "Trades lead system turnaround",
    summary:
      "Missed calls and weak follow-up were bleeding revenue; a connected lead system stabilized bookings.",
    persona: "trades",
    recommendedSystem: "lead_system",
    sections: {
      hero: "Missed calls were turning into missed revenue every week.",
      overview: "A service business had demand but no operating system to capture and convert inquiries.",
      problem: "Leads came in through calls, forms, and DMs, but there was no centralized response flow. Speed-to-lead and follow-up consistency were poor.",
      diagnosis: "Audit showed weak capture points, no accountability loop, and no conversion visibility by source.",
      solution: "Installed a lead system with intake routing, response templates, and follow-up automation tied to CRM stages.",
      results: "Booking consistency improved and response gaps dropped, unlocking more closed jobs from existing demand.",
      visualProof: "Before/after pipeline snapshot and booked job trendline are ready for final metrics.",
      takeaways: "Demand without a system causes hidden leakage. Operational follow-up is a revenue lever.",
      cta: "Run Diagnostic",
    },
    ctaLabel: "Run Diagnostic",
    ctaHref: "/revenue-diagnostic",
  },
  {
    slug: "freelancer-authority-system-upgrade",
    title: "From Underpaid Projects to High-Value Clients",
    subtitle: "Freelancer authority system shift",
    summary:
      "Poor positioning suppressed pricing power; authority system improvements raised client quality.",
    persona: "freelancers",
    recommendedSystem: "authority_system",
    sections: {
      hero: "Great work, wrong positioning, low pricing.",
      overview: "A freelancer delivered strong outcomes but lacked proof structure and premium offer clarity.",
      problem: "Portfolio story, social proof, and proposal framing failed to communicate strategic value.",
      diagnosis: "Messaging mapped to task execution instead of business outcomes, attracting price-sensitive buyers.",
      solution: "Rebuilt authority assets: narrative positioning, proof blocks, and offer framing anchored to ROI.",
      results: "Lead quality improved, pricing conversations shifted up-market, and lower-fit inquiries declined.",
      visualProof: "Proposal conversion and average deal value comparison prepared for final metrics.",
      takeaways: "Authority is a system, not a one-off brand exercise.",
      cta: "Upgrade Your System",
    },
    ctaLabel: "Upgrade Your System",
    ctaHref: "/rebrand-your-business",
  },
  {
    slug: "founder-validation-funnel-traction",
    title: "From Idea to First Users Without Guesswork",
    subtitle: "Founder validation funnel",
    summary:
      "No user traction became structured validation with feedback loops and early adopter conversions.",
    persona: "founders",
    recommendedSystem: "validation_funnel",
    sections: {
      hero: "An idea alone was not converting into users.",
      overview: "A founder needed a repeatable path from concept interest to first validated users.",
      problem: "Traffic landed on generic pages with no clear value test, no segmentation, and no activation path.",
      diagnosis: "Funnel analysis showed unclear promise, weak proof, and no experiment loop for messaging.",
      solution: "Built a validation funnel with segmented messaging, lightweight offer tests, and conversion checkpoints.",
      results: "Early traction formed around clearer value propositions and guided conversion paths.",
      visualProof: "Activation funnel and signup cohort snapshots prepared for final publishing metrics.",
      takeaways: "Validation speed compounds when messaging, proof, and CTA are connected.",
      cta: "Validate Your Idea",
    },
    ctaLabel: "Validate Your Idea",
    ctaHref: "/offers/startup-growth-system",
  },
];
