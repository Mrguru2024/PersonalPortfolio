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
    description: "Here you can manage assessments, contacts, CRM, invoices, and more. This short tour will point you to the main areas.",
    target: "center",
    roles: ["all"],
  },
  {
    id: "summary-cards",
    title: "Summary at a glance",
    description: "These cards show counts for assessments, contact form submissions, and resume requests. Check pending items first to prioritize your day.",
    target: "[data-tour=\"summary-cards\"]",
    roles: ["all"],
  },
  {
    id: "quick-links",
    title: "Quick links",
    description: "Jump to Invoices, Project updates (announcements), and Feedback. Use these daily to stay on top of client work.",
    target: "[data-tour=\"quick-links\"]",
    roles: ["all"],
  },
  {
    id: "development-updates",
    title: "Development updates",
    description: "See what’s new in production. Features and fixes are logged here so you know what’s available.",
    target: "[data-tour=\"development-updates\"]",
    roles: ["all"],
  },
  {
    id: "tabs",
    title: "Assessments, Contacts, Resume",
    description: "Switch between Assessments (project quotes), Contacts (form submissions), and Resume requests. Review and update statuses here.",
    target: "[data-tour=\"tabs\"]",
    roles: ["all"],
  },
  {
    id: "crm-link",
    title: "CRM and more",
    description: "For full lead and deal management, use the CRM: contacts, pipeline, tasks, saved lists, and import. Go to CRM from the main nav or dashboard links.",
    target: "center",
    roles: ["all"],
  },
  {
    id: "daily-habits",
    title: "Daily habits",
    description: "Each visit, check the “Suggested for you” nudges above—they’re tailored to your role and current counts (e.g. pending assessments, unaccessed resumes).",
    target: "center",
    roles: ["all"],
  },
  {
    id: "system",
    title: "System (super admin)",
    description: "As a super admin you can access System (health, logs), Users, and Integrations. Use these for maintenance and troubleshooting.",
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
