/**
 * Structured distillate of Ascendra delivery / operations SOP for:
 * - Admin AI assistant grounding (see server/services/ascendraSopWorkflowLoader.ts)
 * - Agency OS role hints & task templates (reference only until persisted in DB)
 *
 * Human source of truth: `public/Ascendra Technologies SOP.pdf` (update defaults when the PDF changes).
 * Flexible overrides: set env `ASCENDRA_SOP_WORKFLOW_JSON` to a repo-relative JSON file that deep-merges
 * onto this object (see `AscendraSopWorkflowConfig` shape). For any key you send, **arrays replace** the
 * defaults for that key (they are not appended). Omit a key to keep code defaults.
 */

export type SopDeliveryPhase = {
  id: string;
  name: string;
  summary: string;
  objectives: string[];
  qualityGates: string[];
  /** Suggested HVD registry slugs for Agency OS tagging */
  suggestedHvdSlugs: string[];
  /** Execution-role keys (Agency OS) most often accountable */
  primaryRoleKeys: string[];
};

export type SopRolePlaybookHint = {
  /** Short bullets tying the role to SOP expectations */
  sopAnchors: string[];
  /** How the assistant should coach an admin in this role */
  whenHelpingAdmin: string[];
};

export type SopTaskTemplate = {
  id: string;
  title: string;
  primaryHvdSlug: string;
  valueContributions: readonly string[];
  suggestedRoleKey: string | null;
  /** One-paragraph briefing the assistant can reuse when drafting task descriptions */
  briefingForAi: string;
  expectedOutcomeHint: string;
  impactMetricHint: string;
};

export type AscendraSopWorkflowConfig = {
  version: number;
  sourceDocument: {
    title: string;
    /** Public URL path under this app (encoded spaces ok in browser) */
    publicPath: string;
    note: string;
  };
  operatingPrinciples: string[];
  deliveryPhases: SopDeliveryPhase[];
  acceptanceNorms: {
    taskAcceptance: string[];
    documentationHandoff: string[];
    clientComms: string[];
  };
  /** Keys match Agency OS execution-role `key` values; unknown keys are ignored at runtime */
  rolePlaybookHints: Record<string, SopRolePlaybookHint>;
  taskTemplates: SopTaskTemplate[];
  /** Hard rules / tone for the floating admin assistant */
  assistantDirectives: string[];
};

export const ASCENDRA_SOP_WORKFLOW_DEFAULT: AscendraSopWorkflowConfig = {
  version: 1,
  sourceDocument: {
    title: "Ascendra Technologies SOP",
    publicPath: "/Ascendra%20Technologies%20SOP.pdf",
    note: "Structured summary for AI + Agency OS; keep aligned with the PDF. Use ASCENDRA_SOP_WORKFLOW_JSON to merge overrides without code edits.",
  },
  operatingPrinciples: [
    "Scope before build: written outcomes, acceptance criteria, and measurement beats activity lists.",
    "Tie work to High-Value Delivery (HVD) categories and pipeline/revenue language, not vague 'marketing tasks'.",
    "Acceptance-based tasks: assignee confirms understanding and responsibility before execution unless policy allows admin override.",
    "Document decisions, links, and client-visible commitments in CRM or Agency OS narrative fields so the team shares one timeline.",
    "Change control: material scope shifts get explicit client alignment and updated records—not silent drift.",
  ],
  deliveryPhases: [
    {
      id: "intake_alignment",
      name: "Intake & alignment",
      summary: "Clarify goals, constraints, assets, and success signals before substantial build.",
      objectives: [
        "Confirm ICP, offer, and funnel posture align with what we will measure.",
        "Capture access, brand, legal, and technical constraints early.",
      ],
      qualityGates: [
        "Named primary metric + data source for the engagement leg.",
        "Risks and dependencies recorded (creative, dev, media, client turnaround).",
      ],
      suggestedHvdSlugs: ["market_intelligence", "offer_validation"],
      primaryRoleKeys: ["account_lead", "strategist"],
    },
    {
      id: "strategy_plan",
      name: "Strategy & plan",
      summary: "Translate alignment into a sequenced plan with explicit value hypotheses.",
      objectives: [
        "Prioritize HVD lanes that move the agreed metric.",
        "Define experiments or build slices with clear stop/go rules.",
      ],
      qualityGates: [
        "Plan reviewed against AMIE / Growth OS inputs where applicable.",
        "Agency OS project or milestones reflect the sequence (when used).",
      ],
      suggestedHvdSlugs: ["growth_intelligence", "conversion_funnel"],
      primaryRoleKeys: ["strategist", "analyst"],
    },
    {
      id: "build_integrate",
      name: "Build & integrate",
      summary: "Implement funnels, creative, tracking, and integrations with QA discipline.",
      objectives: [
        "Ship shippable increments with test coverage appropriate to risk.",
        "Wire attribution, tags, and CRM hooks before scaling traffic.",
      ],
      qualityGates: [
        "Technical QA + visual QA on target breakpoints; privacy-sensitive fields handled.",
        "Event / conversion verification documented (tooling screenshot or log reference).",
      ],
      suggestedHvdSlugs: ["conversion_funnel", "lead_capture_crm"],
      primaryRoleKeys: ["developer", "designer", "copywriter"],
    },
    {
      id: "launch_optimize",
      name: "Launch, learn, optimize",
      summary: "Controlled launch with monitoring; iterate on creative, targeting, and landing experience.",
      objectives: [
        "Prove measurement integrity before budget ramps.",
        "Tight iteration loops on under-performing components.",
      ],
      qualityGates: [
        "Lead quality reviewed in CRM / Lead Control cadence.",
        "Optimization notes captured (what changed, why, expected effect).",
      ],
      suggestedHvdSlugs: ["traffic_acquisition", "booking_conversion", "revenue_optimization"],
      primaryRoleKeys: ["media_buyer", "analyst", "strategist"],
    },
    {
      id: "report_govern",
      name: "Reporting & governance",
      summary: "Regular transparency: what happened, what we learned, what is next.",
      objectives: [
        "Client-visible reporting matches internal numbers within agreed definitions.",
        "Backlog and risks are visible to account lead and strategist.",
      ],
      qualityGates: [
        "Cadence met (weekly/biweekly as scoped) with narrative, not only vanity metrics.",
        "Agency OS tasks closed or re-pointed; blockers escalated with owners.",
      ],
      suggestedHvdSlugs: ["growth_intelligence", "content_authority"],
      primaryRoleKeys: ["account_lead", "analyst"],
    },
  ],
  acceptanceNorms: {
    taskAcceptance: [
      "Use Agency OS tasks for internal accountability; acceptance confirms scope understanding.",
      "Decline with a reason or request clarification rather than silently stalling.",
      "If env AGENCY_OS_ADMIN_TASK_ACCEPTANCE is off, only the assignee may accept—respect that boundary when advising.",
    ],
    documentationHandoff: [
      "Link SOPs/playbooks in Agency OS when they define the standard of care for a deliverable.",
      "Prefer a single source of truth: if it affects billing or client promises, it belongs in agreement + CRM notes.",
    ],
    clientComms: [
      "Distinguish educational positioning from binding guarantees—point to `/service-engagement` and signed agreements when asked.",
    ],
  },
  rolePlaybookHints: {
    strategist: {
      sopAnchors: ["Owns sequencing and trade-offs across HVD lanes.", "Ensures plans map to measurable outcomes and client capacity."],
      whenHelpingAdmin: [
        "Push for explicit primary metrics and stop conditions before recommending tactics.",
        "Cross-check against AMIE / Growth OS artifacts when the admin references markets or personas.",
      ],
    },
    developer: {
      sopAnchors: ["Shipping, integrations, reliability; measurement plumbing is part of done."],
      whenHelpingAdmin: [
        "Prefer smallest safe change sets; call out migration, PII, and rollback paths.",
        "Reference existing routes under `/api/admin/*` before inventing new patterns.",
      ],
    },
    designer: {
      sopAnchors: ["Conversion-oriented UX, brand consistency, accessibility-aware layouts."],
      whenHelpingAdmin: [
        "Tie layout suggestions to funnel step and mobile-first reading order.",
      ],
    },
    copywriter: {
      sopAnchors: ["Offer-accurate messaging; variant thinking for tests."],
      whenHelpingAdmin: [
        "Lead with outcome language; flag claims that may need legal/client approval.",
      ],
    },
    media_buyer: {
      sopAnchors: ["Structure, budgets, creative iteration, policy-safe ads setup."],
      whenHelpingAdmin: [
        "Always separate platform spend from management fees unless scope says otherwise.",
        "Tie spend recommendations to readiness gates and lead quality feedback.",
      ],
    },
    analyst: {
      sopAnchors: ["Definitions, dashboards, experiment readouts, anomaly surfacing."],
      whenHelpingAdmin: [
        "State metric definitions; warn on thin sample sizes before declaring winners.",
      ],
    },
    account_lead: {
      sopAnchors: ["Client rhythm, approvals, risk surfacing, scope stewardship."],
      whenHelpingAdmin: [
        "Mirror commitments back; ensure CRM and Agency OS reflect the same next steps.",
      ],
    },
  },
  taskTemplates: [
    {
      id: "harden_conversion_tracking",
      title: "Verify conversion tracking + CRM handoff for primary funnel",
      primaryHvdSlug: "lead_capture_crm",
      valueContributions: ["leads", "visibility"],
      suggestedRoleKey: "developer",
      briefingForAi:
        "Confirm events, UTMs, and CRM field mapping for the main lead path; document proof for the account lead.",
      expectedOutcomeHint: "Primary conversion path produces attributable records in CRM with agreed field population.",
      impactMetricHint: "% of test leads appearing with correct source + stage within 15 minutes.",
    },
    {
      id: "weekly_growth_readout",
      title: "Prepare internal weekly growth readout (volume, quality, actions)",
      primaryHvdSlug: "growth_intelligence",
      valueContributions: ["visibility", "efficiency"],
      suggestedRoleKey: "analyst",
      briefingForAi:
        "Summarize funnel, ads, and CRM movement vs prior week; list 3 prioritized actions with owners.",
      expectedOutcomeHint: "Account and strategist can decide next week’s focus with shared numbers.",
      impactMetricHint: "Time-to-insight; count of decisions explicitly recorded.",
    },
    {
      id: "offer_page_copy_refresh",
      title: "Refresh core offer page copy against current positioning",
      primaryHvdSlug: "offer_validation",
      valueContributions: ["conversions"],
      suggestedRoleKey: "copywriter",
      briefingForAi:
        "Align copy with approved offer; flag any new claims; suggest one A/B headline candidate.",
      expectedOutcomeHint: "Page reflects current offer with clearer outcome framing and compliance-safe claims.",
      impactMetricHint: "Step conversion to next funnel stage or booked call rate.",
    },
  ],
  assistantDirectives: [
    "When the admin asks 'what should we do next?', map recommendations to a delivery phase + HVD slug + measurable check.",
    "Prefer Agency OS primitives (projects, milestones, tasks, roles, SOPs) when advising internal delivery—cite routes from the FEATURE GUIDE.",
    "If instructions conflict with the countersigned client agreement, say the agreement wins and suggest they verify with the account lead.",
    "The Ascendra Core Guarantee (public) describes system build and visibility—not guaranteed business outcomes—mirror that nuance under `/service-engagement` framing.",
    "Unknown overrides: if `ASCENDRA_SOP_WORKFLOW_JSON` is set, treat merged JSON as authoritative extensions to this block.",
  ],
};
