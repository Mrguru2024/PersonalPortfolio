/**
 * Lead/contact lifecycle status ordering (crm_contacts.status).
 * Terminal states won/lost are set from deal outcomes, not auto-advanced by outbound messages.
 */

export const CRM_LEAD_CONTACT_STATUS_ORDER = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
] as const;

export type CrmLeadContactPipelineStatus = (typeof CRM_LEAD_CONTACT_STATUS_ORDER)[number];

const TERMINAL = new Set(["won", "lost"]);

export function normalizeLeadContactStatus(raw: string | null | undefined): string {
  const s = (raw ?? "new").trim().toLowerCase();
  if (!s) return "new";
  if (TERMINAL.has(s)) return s;
  if ((CRM_LEAD_CONTACT_STATUS_ORDER as readonly string[]).includes(s)) return s;
  return "new";
}

/** Next step in the pipeline, or null if already at the end or terminal. */
export function getNextLeadContactStatus(current: string | null | undefined): string | null {
  const n = normalizeLeadContactStatus(current);
  if (n === "won" || n === "lost") return null;
  const idx = CRM_LEAD_CONTACT_STATUS_ORDER.indexOf(n as CrmLeadContactPipelineStatus);
  if (idx === -1) return CRM_LEAD_CONTACT_STATUS_ORDER[1] ?? "contacted";
  if (idx >= CRM_LEAD_CONTACT_STATUS_ORDER.length - 1) return null;
  return CRM_LEAD_CONTACT_STATUS_ORDER[idx + 1] ?? null;
}
