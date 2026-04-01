/** Response shape for GET /api/client/ppc-summary (client portal). */

export type ClientPpcSummaryCampaign = {
  id: number;
  name: string;
  status: string;
  statusLabel: string;
  clientLabel: string | null;
  readinessScore: number | null;
  growthRouteLabel: string | null;
};

export type ClientPpcSummaryResponse =
  | {
      mode: "disabled";
      headline: string;
      body: string;
    }
  | {
      mode: "pending";
      pendingReason: "no_campaigns_linked" | "campaigns_not_found";
      headline: string;
      body: string;
      campaigns: ClientPpcSummaryCampaign[];
      primary: { qualifiedLeads: number; bookedCalls: number; newCustomers: number };
      recommendations: string[];
    }
  | {
      mode: "ready";
      campaigns: ClientPpcSummaryCampaign[];
      primary: { qualifiedLeads: number; bookedCalls: number; newCustomers: number };
      recommendations: string[];
    };
