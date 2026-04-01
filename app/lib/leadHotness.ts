/**
 * Hot-lead clock + urgency flags for Lead Control UI (CRM-backed).
 */

export type HotLeadUrgency = "immediate" | "soon" | "normal";

export type LeadHotnessInput = {
  createdAt: string | Date;
  firstResponseAt?: string | Date | null;
  intentLevel?: string | null;
  leadControlPriority?: string | null;
};

const HOT_INTENTS = new Set(["hot_lead", "high_intent"]);

/** Minutes since createdAt (floor). */
export function minutesSinceLeadCreated(createdAt: string | Date): number {
  const t = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 60_000));
}

function formatDurationShort(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function describeLeadAge(createdAt: string | Date): { minutes: number; label: string } {
  const minutes = minutesSinceLeadCreated(createdAt);
  return { minutes, label: formatDurationShort(minutes) };
}

/**
 * Visual urgency: hot/high intent or P1/P2 without first response within window.
 */
export function getHotLeadUrgency(input: LeadHotnessInput): HotLeadUrgency {
  const { minutes } = describeLeadAge(input.createdAt);
  const hasResponse = input.firstResponseAt != null && String(input.firstResponseAt).length > 2;
  const hotIntent = input.intentLevel ? HOT_INTENTS.has(input.intentLevel) : false;
  const p = input.leadControlPriority ?? "";
  const priorityHot = p === "P1" || p === "P2";

  if (hasResponse) return "normal";

  if (priorityHot && minutes <= 15) return "immediate";
  if (hotIntent && minutes <= 30) return "immediate";
  if (priorityHot && minutes <= 120) return "soon";
  if (hotIntent && minutes <= 240) return "soon";

  return "normal";
}

export function hotLeadNeedsContactCopy(urgency: HotLeadUrgency): string | null {
  if (urgency === "immediate") return "Needs contact now — no logged response yet.";
  if (urgency === "soon") return "Follow up soon — high intent or priority queue.";
  return null;
}
