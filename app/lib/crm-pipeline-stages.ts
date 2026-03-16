/** Default pipeline stages for leads/opportunities. */
export const CRM_PIPELINE_STAGES = [
  "new_lead",
  "researching",
  "qualified",
  "proposal_ready",
  "follow_up",
  "negotiation",
  "won",
  "lost",
  "nurture",
] as const;

export type CrmPipelineStage = (typeof CRM_PIPELINE_STAGES)[number];

export const CRM_PIPELINE_STAGE_LABELS: Record<string, string> = {
  new_lead: "New lead",
  researching: "Researching",
  qualified: "Qualified",
  proposal_ready: "Proposal ready",
  follow_up: "Follow up",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  nurture: "Nurture",
};

export function getPipelineStageLabel(stage: string | null | undefined): string {
  return (stage && CRM_PIPELINE_STAGE_LABELS[stage]) || stage || "—";
}
