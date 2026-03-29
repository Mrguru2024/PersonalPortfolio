/**
 * Admin guidance tour: steps and role-based visibility.
 * Steps target elements with data-tour="<stepId>" on the admin dashboard.
 * roles: "all" = every approved admin; "super" = super admin only.
 */

export type TourStepRole = "all" | "super";

export interface AdminTourStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector or "center" for floating card only */
  target: string;
  /** Which roles see this step. "all" = all admins, "super" = super admins only */
  roles: TourStepRole[];
}

export const ADMIN_TOUR_STEPS: AdminTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Admin Dashboard",
    description:
      "This page prioritizes **inbound work** first (suggested actions, reminders, inbox lists), then shortcuts and utilities. The tour walks through the main areas in that order. Throughout the app, small ? icons next to titles and fields explain that screen—not the top menu.",
    target: "center",
    roles: ["all"],
  },
  {
    id: "summary-cards",
    title: "Summary at a glance",
    description:
      "These counts mirror your inbox: assessments and contacts. Use them with the **Inbox** section right below to spot volume before you triage.",
    target: "[data-tour=\"summary-cards\"]",
    roles: ["all"],
  },
  {
    id: "tabs",
    title: "Inbox — Assessments, Contacts, Resume",
    description:
      "Your primary work queue. Switch tabs to review submissions, update assessment status, and follow up. Use Lead intake hub when routing quizzes and CRM import.",
    target: "[data-tour=\"tabs\"]",
    roles: ["all"],
  },
  {
    id: "quick-links",
    title: "Workspace shortcuts",
    description:
      "Meetings & calendar and booking setup appear first; then invoices, Growth OS, Content Studio, site directory, and more.",
    target: "[data-tour=\"quick-links\"]",
    roles: ["all"],
  },
  {
    id: "development-updates",
    title: "Development updates",
    description:
      "Optional release notes near the bottom of the dashboard. Expand when you want to see what shipped to production.",
    target: "[data-tour=\"development-updates\"]",
    roles: ["all"],
  },
  {
    id: "learn-more",
    title: "Learning on any admin page",
    description:
      "Multi-step playbooks (e.g. LTV, discovery) live in **How-to & guides** in this shortcuts row. The **Assistant knowledge** shortcut opens entries you can toggle so trusted text flows into the floating assistant. Prefer ? tips on each screen first—they describe the fields and buttons in front of you.",
    target: "center",
    roles: ["all"],
  },
  {
    id: "crm-link",
    title: "CRM and more",
    description:
      "The CRM is for **doing** lead work: stages, tasks, imports, saved lists, and full contact records. Open it when you’re acting on prospects; each CRM screen has its own ? help for filters, bulk actions, and saves.",
    target: "center",
    roles: ["all"],
  },
  {
    id: "daily-habits",
    title: "Daily habits",
    description:
      "The **Suggested for you** strip on this page reacts to your role and live counts (pending assessments, new contacts, etc.). Use it as a same-day checklist; follow into each area and rely on local ? tips for the next click.",
    target: "center",
    roles: ["all"],
  },
  {
    id: "system",
    title: "System (super admin)",
    description:
      "**System** surfaces health and logs; **Users** controls approvals and access; **Connections** verifies email and social integrations. Use those screens when debugging or onboarding—not for day-to-day CRM or content tasks. Each screen explains its own panels via ? icons.",
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
