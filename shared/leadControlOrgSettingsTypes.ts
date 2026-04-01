/**
 * Org-wide Lead Control configuration (singleton DB row). Kept separate from crmSchema
 * to avoid circular imports with routing evaluation.
 */

export type LeadControlRoutingRuleCondition = {
  /** Any substring match against intent_level (case-insensitive) */
  intentIncludes?: string[];
  statusIn?: string[];
  lifecycleStageIn?: string[];
  minLeadScore?: number;
  maxLeadScore?: number;
  /** true = must have bookedCallAt; false = must not */
  hasBookedCall?: boolean;
  /** Any CRM tag substring match (case-insensitive) */
  tagIncludes?: string[];
  /** Substring match on source (case-insensitive) */
  sourceIncludes?: string[];
};

export type LeadControlRoutingRule = {
  /** Stable id for UI (e.g. nanoid or uuid) */
  id: string;
  enabled: boolean;
  /** Optional label in admin UI */
  label?: string;
  /** Written to crm_contacts.lead_routing_hint when this rule matches */
  hint: string;
  /** All set fields are AND’d. Empty object matches any contact (use as last default rule). */
  if: LeadControlRoutingRuleCondition;
};

export type LeadControlOrgConfig = {
  routingRules: LeadControlRoutingRule[];
};
