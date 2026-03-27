/** Aggregates for admin LTV / revenue snapshot (CRM deals + contact estimates). */

export type CrmLtvSourceRow = {
  source: string;
  totalCents: number;
  contactCount: number;
};

/** High-value contacts for quick links from the LTV workspace */
export type CrmLtvTopContactRow = {
  id: number;
  name: string;
  company: string | null;
  type: string;
  estimatedValueCents: number;
};

export type CrmLtvSnapshot = {
  wonDealValueCents: number;
  openPipelineValueCents: number;
  clientCount: number;
  clientsWithEstimateCount: number;
  totalClientEstimatedLtvCents: number;
  avgClientEstimatedLtvCents: number | null;
  leadsWithEstimateCount: number;
  totalLeadEstimatedValueCents: number;
  contactsMissingEstimateCount: number;
  topSourcesByValue: CrmLtvSourceRow[];
  topContactsByEstimate: CrmLtvTopContactRow[];
};
