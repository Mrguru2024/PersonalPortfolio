import type { CrmContact } from "./crmSchema";

export type LeadControlPriorityBand = "P1" | "P2" | "P3" | "P4" | "P5";

/**
 * Transparent, editable rules for Lead Control sort order.
 * Adjust weights here — UI and API should persist the result on `crm_contacts.leadControlPriority`.
 */
export function computeLeadControlPriority(contact: CrmContact, now: Date = new Date()): LeadControlPriorityBand {
  const tags = (contact.tags ?? []) as string[];
  const tagStr = tags.map((t) => String(t).toLowerCase()).join(" ");
  if (contact.doNotContact) return "P5";
  if (tagStr.includes("spam") || tagStr.includes("poor_fit") || contact.status === "lost") return "P5";

  const intent = (contact.intentLevel ?? "").toLowerCase();
  const hotIntent = intent.includes("hot") || intent === "high_intent";
  const booked = contact.bookedCallAt != null;

  const nextFu = contact.nextFollowUpAt ? new Date(contact.nextFollowUpAt) : null;
  const followUpOverdue = nextFu != null && nextFu < now;

  if (hotIntent && (followUpOverdue || contact.status === "new")) return "P1";
  if (followUpOverdue && contact.type === "lead") return "P1";
  if (hotIntent || booked) return "P2";

  const score = contact.leadScore ?? 0;
  if (score >= 60 || contact.lifecycleStage === "sales_ready") return "P2";
  if (score >= 35 || contact.lifecycleStage === "qualified") return "P3";

  const lowIntent = intent.includes("low") || contact.lifecycleStage === "cold";
  if (lowIntent) return "P4";

  return "P3";
}

export function leadControlPriorityLabel(band: LeadControlPriorityBand): string {
  switch (band) {
    case "P1":
      return "Urgent — respond now";
    case "P2":
      return "High value / hot";
    case "P3":
      return "Standard queue";
    case "P4":
      return "Nurture";
    case "P5":
      return "Archive / review later";
    default:
      return band;
  }
}
