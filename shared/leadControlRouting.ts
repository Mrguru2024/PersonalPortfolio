import type { CrmContact } from "./crmSchema";
import type { LeadControlOrgConfig, LeadControlRoutingRuleCondition } from "./leadControlOrgSettingsTypes";

function norm(s: string | null | undefined): string {
  return String(s ?? "").toLowerCase();
}

export function ruleConditionMatches(contact: CrmContact, cond: LeadControlRoutingRuleCondition): boolean {
  const keys = Object.keys(cond).filter((k) => cond[k as keyof LeadControlRoutingRuleCondition] !== undefined);
  if (keys.length === 0) return true;

  if (cond.intentIncludes?.length) {
    const intent = norm(contact.intentLevel);
    if (!cond.intentIncludes.some((x) => intent.includes(norm(x)))) return false;
  }
  if (cond.statusIn?.length) {
    const st = contact.status ?? "";
    if (!cond.statusIn.includes(st)) return false;
  }
  if (cond.lifecycleStageIn?.length) {
    const ls = contact.lifecycleStage ?? "";
    if (!cond.lifecycleStageIn.includes(ls)) return false;
  }
  if (cond.minLeadScore != null) {
    const score = contact.leadScore ?? 0;
    if (score < cond.minLeadScore) return false;
  }
  if (cond.maxLeadScore != null) {
    const score = contact.leadScore ?? 0;
    if (score > cond.maxLeadScore) return false;
  }
  if (cond.hasBookedCall === true && contact.bookedCallAt == null) return false;
  if (cond.hasBookedCall === false && contact.bookedCallAt != null) return false;
  if (cond.tagIncludes?.length) {
    const tags = (contact.tags ?? []).map((t) => norm(String(t)));
    if (!cond.tagIncludes.some((x) => tags.some((t) => t.includes(norm(x))))) return false;
  }
  if (cond.sourceIncludes?.length) {
    const src = norm(contact.source);
    if (!cond.sourceIncludes.some((x) => src.includes(norm(x)))) return false;
  }

  return true;
}

/** First enabled matching rule wins; otherwise null (clear hint on recompute). */
export function evaluateLeadControlRoutingHint(
  contact: CrmContact,
  config: LeadControlOrgConfig | null | undefined,
): string | null {
  const rules = config?.routingRules ?? [];
  for (const rule of rules) {
    if (!rule?.enabled) continue;
    if (!rule.hint || typeof rule.hint !== "string") continue;
    if (ruleConditionMatches(contact, rule.if ?? {})) {
      return rule.hint.trim().slice(0, 64) || null;
    }
  }
  return null;
}
