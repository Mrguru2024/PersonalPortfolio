/**
 * Admin guidance tour: steps and role-based visibility.
 * Steps target `[data-tour="…"]` anchors on the admin dashboard (and layout).
 * Order is intentional: highest-impact workflows and “how do I…?” first.
 * roles: "all" = every approved admin; "super" = super admin only.
 */

export type TourStepRole = "all" | "super";

export interface AdminTourStep {
  id: string;
  title: string;
  description: string;
  /** Short how-tos / possibilities (shown as bullets under the description). */
  tips?: string[];
  /** CSS selector or "center" for floating card only */
  target: string;
  /** Which roles see this step. "all" = all admins, "super" = super admins only */
  roles: TourStepRole[];
}

export const ADMIN_TOUR_STEPS: AdminTourStep[] = [
  {
    id: "welcome",
    title: "Welcome — admin workspace",
    description:
      "This is your control center for client work, leads, and growth tools. The next steps follow priority: what to do first, where to click, and how to go deeper.",
    tips: [
      "You can restart this tour anytime from “Suggested for you” after you finish or dismiss it once.",
      "Contextual help: open “Platform tips” at the top on any admin page for section-specific how-tos.",
    ],
    target: "center",
    roles: ["all"],
  },
  {
    id: "platform-tips",
    title: "Platform tips (every admin page)",
    description:
      "This panel is available across the admin area. It explains how to use the screen you’re on and what’s possible there—including CRM, content, and growth workflows.",
    tips: [
      "Expand it whenever you land on an unfamiliar section.",
      "Tips update by route (e.g. CRM vs dashboard vs blog).",
    ],
    target: "[data-tour=\"platform-tips\"]",
    roles: ["all"],
  },
  {
    id: "daily-nudges",
    title: "Start here: suggested actions",
    description:
      "These links reflect your role and live counts (pending assessments, unaccessed resumes, etc.). Use them to clear the highest-impact queue first.",
    tips: [
      "Counts update as you work through the dashboard data below.",
      "Links deep-link into CRM tasks, blog, analytics, and more depending on your operator focus.",
    ],
    target: "[data-tour=\"daily-nudges\"]",
    roles: ["all"],
  },
  {
    id: "operator-intelligence",
    title: "Operator profile & AI plan",
    description:
      "Your role focus and an AI-assisted daily/weekly plan based on what’s actually in the system (counts, priorities). Adjust your operator profile to steer nudges and plans.",
    tips: [
      "Set role focus once so “Suggested for you” and plans stay aligned with how you work.",
    ],
    target: "[data-tour=\"operator-intelligence\"]",
    roles: ["all"],
  },
  {
    id: "reminders",
    title: "Growth reminders",
    description:
      "Platform-driven tasks and goals—separate from CRM tasks. Use this to remember recurring growth work (content, campaigns, housekeeping).",
    tips: [
      "Generate or complete items here so nothing important stays only in your head.",
    ],
    target: "[data-tour=\"reminders\"]",
    roles: ["all"],
  },
  {
    id: "summary-cards",
    title: "Summary at a glance",
    description:
      "Assessments (project quotes), contact form submissions, and resume requests—your three inbound streams on this dashboard.",
    tips: [
      "Watch “pending” on assessments to prioritize quotes.",
      "Resume “unaccessed” flags items you haven’t opened yet.",
    ],
    target: "[data-tour=\"summary-cards\"]",
    roles: ["all"],
  },
  {
    id: "crm-entry",
    title: "CRM — leads, deals, and pipeline",
    description:
      "Full CRM lives in its own area: contacts, filters, deals, tasks, sequences, saved lists, import, and accounts. Use this button anytime from the dashboard.",
    tips: [
      "Contacts list: filter by industry, location, persona, intent, and see who added each lead.",
      "Pipeline and tasks: move deals and clear follow-ups without losing context.",
    ],
    target: "[data-tour=\"crm-entry\"]",
    roles: ["all"],
  },
  {
    id: "quick-links",
    title: "More shortcuts",
    description:
      "Jump to invoices, announcements, feedback, offers, Growth OS, funnel audit, offer valuation, Content Studio, and the site directory—without hunting the sidebar.",
    tips: [
      "Site directory: searchable map of routes for you and for AI assistants (copy JSON).",
      "Content Studio: drafts, scheduling, and social where configured.",
    ],
    target: "[data-tour=\"quick-links\"]",
    roles: ["all"],
  },
  {
    id: "development-updates",
    title: "What shipped (development updates)",
    description:
      "A living changelog: features and fixes merged to production. In production it usually loads from GitHub; locally it reads the markdown file on disk.",
    tips: [
      "Refresh the panel to pull the latest sections.",
      "Add dated ## headings in content/development-updates.md when you ship meaningful changes.",
    ],
    target: "[data-tour=\"development-updates\"]",
    roles: ["all"],
  },
  {
    id: "tabs",
    title: "Assessments, contacts, resume",
    description:
      "Work the same three streams in detail: change assessment status, reply to form contacts, and track resume requests. Everything here stays on the classic dashboard.",
    tips: [
      "Use the Lead intake hub link for unified diagnosis / funnel flows with optional CRM import.",
      "Create client quotes from assessments when you’re ready to formalize pricing.",
    ],
    target: "[data-tour=\"tabs\"]",
    roles: ["all"],
  },
  {
    id: "communications-content",
    title: "Communications & audience",
    description:
      "Email designs, campaigns, and segments live under Communications. Pair that with newsletters, blog, and Content Studio for a full content and outbound loop.",
    tips: [
      "Campaigns: draft audience and design while status is draft; review sends and segments before going live.",
      "Newsletters and blog: separate from transactional CRM email—use each where it fits.",
    ],
    target: "center",
    roles: ["all"],
  },
  {
    id: "system",
    title: "Super admin: system & users",
    description:
      "As a super admin you also have System (health, activity), user administration, and integrations. Use those for troubleshooting, audits, and access control.",
    tips: [
      "Health and activity routes help verify cron, API, and environment issues in production.",
    ],
    target: "center",
    roles: ["super"],
  },
];

const STORAGE_KEY = "admin_tour_completed_v1";
const STORAGE_KEY_DISMISSED = "admin_tour_dismissed_v1";

export function getTourCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTourCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function getTourDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === "1";
  } catch {
    return false;
  }
}

export function setTourDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY_DISMISSED, "1");
  } catch {
    // ignore
  }
}

export function getStepsForRole(isSuperAdmin: boolean): AdminTourStep[] {
  return ADMIN_TOUR_STEPS.filter(
    (s) => s.roles.includes("all") || (isSuperAdmin && s.roles.includes("super"))
  );
}
