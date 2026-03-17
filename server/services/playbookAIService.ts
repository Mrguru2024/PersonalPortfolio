/**
 * AI service for generating sales playbook content (OpenAI).
 * Optional: requires OPENAI_API_KEY.
 */

import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set. AI playbook generation is disabled.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export interface GeneratedPlaybookContent {
  description: string;
  checklistItems: string[];
  qualificationRules: string;
  redFlags: string;
  proposalRequirements: string;
  followUpGuidance: string;
  platformTips: string[];
}

/** Static platform tips when AI is not configured. Keyed by section. */
const STATIC_PLATFORM_TIPS: Record<string, string[]> = {
  playbooks: [
    "Playbooks are reusable guides for qualification, discovery, and proposal—create one per service or process.",
    "Link playbooks to deals from the deal/lead detail page to keep the team aligned.",
    "Use the Discovery workspace to run calls; attach a playbook there for suggested questions and checklist.",
    "Generate with AI to draft content from a title and category, then edit to match your process.",
  ],
  discovery: [
    "Open a lead from Contacts, then use Discovery to prepare and run discovery calls.",
    "AI guidance on the lead can suggest discovery questions and qualification gaps—generate guidance first.",
    "Attach a playbook in the Discovery workspace for a structured checklist and follow-up steps.",
  ],
  "proposal-prep": [
    "Proposal prep uses AI guidance (lead summary, proposal_prep) to suggest offer direction and assumptions to validate.",
    "Generate contact guidance from the lead profile, then open Proposal prep to see tailored prep notes.",
  ],
  contacts: [
    "Add leads as Contacts; use the pipeline to move them through stages.",
    "Generate AI guidance on a lead to get next-best actions, qualification gaps, and discovery questions.",
    "Create tasks from the lead profile or by accepting AI recommendations.",
  ],
  pipeline: [
    "Drag deals between stages to update pipeline; activity is logged automatically.",
    "Filter by stage or owner to focus on what needs attention.",
  ],
  general: [
    "CRM: Contacts = leads; Pipeline = deal stages; Playbooks = reusable process guides.",
    "Discovery and Proposal prep workspaces use AI guidance—generate guidance on a contact first for best results.",
    "Tasks can be created from lead profiles or from accepting AI next-best-action recommendations.",
  ],
  dashboard: [
    "Use the dashboard to see at-a-glance activity, recent contacts, and quick links to CRM, blog, and newsletters.",
    "Navigate to CRM for leads and pipeline, or use the sidebar for tasks, playbooks, and discovery.",
  ],
  blog: [
    "Create and edit posts here; use AI tools to generate or improve content and images.",
    "Publish or schedule posts and manage tags and SEO from the edit screen.",
  ],
  newsletters: [
    "Create newsletters and manage subscribers; use AI to generate or improve content.",
    "Track sends and engagement from the newsletter list and subscriber pages.",
  ],
  invoices: [
    "Create invoices and link them to CRM contacts when needed.",
    "Send or remind from the invoice list; track status and payments.",
  ],
};

export async function generatePlaybookContent(opts: {
  title: string;
  category?: string | null;
  serviceType?: string | null;
}): Promise<GeneratedPlaybookContent> {
  const client = getOpenAIClient();
  const { title, category, serviceType } = opts;

  const prompt = `You are a sales operations expert for a B2B agency (web design, funnel optimization, branding). Generate a concise internal sales playbook.

Title: "${title}"${category ? `\nCategory: ${category}` : ""}${serviceType ? `\nService type: ${serviceType}` : ""}

Return a valid JSON object only (no markdown, no code fence) with exactly these keys:
- "description": 1-2 sentences on when to use this playbook.
- "checklistItems": array of 4-8 short strings (e.g. "Confirm budget range").
- "qualificationRules": 1-3 sentences on what must be true to qualify.
- "redFlags": 1-3 sentences on warning signs to watch for.
- "proposalRequirements": 1-3 sentences on what must be confirmed before proposing.
- "followUpGuidance": 1-2 sentences on how to follow up.
- "platformTips": array of 2-4 short strings (each one sentence) telling the admin HOW to use this playbook in the CRM platform. Examples: "Link this playbook to deals in the pipeline for quick reference." "Use in the Discovery workspace when running discovery calls." "Pin to high-value deal types so the team sees it first." Be specific to using the platform, not generic sales advice.

Keep each field practical and brief. Output only the JSON object.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You output only valid JSON. No explanation, no markdown." },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 1400,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  const platformTips = Array.isArray(parsed.platformTips)
    ? parsed.platformTips.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];

  return {
    description: typeof parsed.description === "string" ? parsed.description : "",
    checklistItems: Array.isArray(parsed.checklistItems)
      ? parsed.checklistItems.filter((x): x is string => typeof x === "string")
      : [],
    qualificationRules: typeof parsed.qualificationRules === "string" ? parsed.qualificationRules : "",
    redFlags: typeof parsed.redFlags === "string" ? parsed.redFlags : "",
    proposalRequirements: typeof parsed.proposalRequirements === "string" ? parsed.proposalRequirements : "",
    followUpGuidance: typeof parsed.followUpGuidance === "string" ? parsed.followUpGuidance : "",
    platformTips: platformTips.length > 0 ? platformTips : STATIC_PLATFORM_TIPS.playbooks,
  };
}

/**
 * Returns platform usage tips for admins: how to use CRM features (playbooks, discovery, proposal prep, contacts, pipeline).
 * When OPENAI_API_KEY is set, can optionally use AI to tailor tips; otherwise returns static tips for the section.
 */
export async function getAdminPlatformTips(section?: string | null): Promise<{ tips: string[]; source: "static" | "ai" }> {
  const key = section && section.trim() ? section.trim().toLowerCase() : "general";
  const staticTips = STATIC_PLATFORM_TIPS[key] ?? STATIC_PLATFORM_TIPS.general;

  if (!process.env.OPENAI_API_KEY) {
    return { tips: staticTips, source: "static" };
  }

  try {
    const client = getOpenAIClient();
    const sectionContext =
      key === "playbooks"
        ? "Playbooks: creating and editing playbooks, linking to deals, using in Discovery workspace."
        : key === "discovery"
          ? "Discovery workspace: preparing and running discovery calls, using playbooks and AI guidance."
          : key === "proposal-prep"
            ? "Proposal prep: using AI guidance to prepare proposals, validating assumptions."
            : key === "contacts"
              ? "Contacts/leads: adding leads, generating AI guidance, next-best actions, tasks."
            : key === "pipeline"
              ? "Pipeline: deal stages, moving deals, filtering."
              : key === "dashboard"
                ? "Admin dashboard: overview, quick links to CRM, blog, newsletters, and tasks."
              : key === "blog"
                ? "Blog: creating and editing posts, AI content and image tools, publishing and SEO."
              : key === "newsletters"
                ? "Newsletters: creating campaigns, managing subscribers, AI content, tracking sends."
              : key === "invoices"
                ? "Invoices: creating and sending invoices, linking to CRM contacts, reminders."
              : "General admin: CRM, dashboard, blog, newsletters, invoices, and how to use the platform.";

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful guide for admins using a B2B sales CRM. Give 4-6 short, actionable tips (one sentence each) about how to use the platform. Be specific to the features mentioned. Output a JSON object with a single key \"tips\" whose value is an array of strings. No markdown, no code fence.",
        },
        {
          role: "user",
          content: `Platform context: ${sectionContext}. Return JSON: { "tips": ["tip1", "tip2", ...] } with 4-6 tips.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
    if (tips.length > 0) return { tips, source: "ai" };
  } catch {
    // fallback to static
  }
  return { tips: staticTips, source: "static" };
}
