export type AmieMarketTrend = "growing" | "stable" | "declining";

export type AmieOpportunityTier = "high" | "medium" | "low";

export type AmieDataMode = "mock" | "live" | "mixed";

export type AmieMarketInput = {
  projectKey?: string;
  industry: string;
  serviceType: string;
  location: string;
  persona: string;
};

export type AmieRawSignals = {
  monthlySearchVolume: number;
  /** Approximate Google Trends slope (-1 … 1). */
  trendSlope: number;
  competitorCount: number;
  avgCompetitorRating: number;
  totalReviewCount: number;
  medianIncome: number;
  homeownershipRate: number;
  /** 0–1 economic / establishment density proxy. */
  businessDensity: number;
  /** 0–1 local spending / retail proxy. */
  spendingProxy: number;
  estimatedCpc: number;
  /** 0–100 saturation heuristic. */
  adSaturationProxy: number;
  painKeywordHits: {
    emergency: number;
    urgent: number;
    upgrade: number;
    informational: number;
  };
  keywords: Array<{ term: string; volume: number; intent: "high" | "medium" | "low" }>;
  competitorSamples: Array<{
    name: string;
    rating: number;
    reviewCount: number;
    distanceKm: number;
    /** Present when sourced from Google Places. */
    formattedAddress?: string;
  }>;
  /** Where competitor list & aggregates came from. */
  competitorProvenance?: "google_places" | "synthetic";
  /** Query sent to Google Places (for transparency). */
  competitorSearchQuery?: string;
};

export type AmieMarketDataDTO = {
  demandScore: number;
  competitionScore: number;
  purchasePowerScore: number;
  painScore: number;
  targetingDifficulty: number;
  marketTrend: AmieMarketTrend;
  avgPrice: number | null;
  keywordData: Record<string, unknown>;
  trendData: Record<string, unknown>;
  incomeData: Record<string, unknown>;
  competitionData: Record<string, unknown>;
  sources: Array<{ provider: string; label: string; retrievedAt: string; note?: string }>;
  dataMode: AmieDataMode;
};

export type AmieOpportunityDTO = {
  opportunityTier: AmieOpportunityTier;
  rulesFired: string[];
  summary: string;
  insights: string[];
  recommendations: string;
  personaStrategy: string;
  leadStrategy: string;
  funnelStrategy: string;
  adStrategy: string;
};

export type AmieIntegrationHints = {
  version: 1;
  suggestedLeadFitScore: number;
  qualificationNotes: string[];
  suggestedFunnelArchetype: string;
  offerPricingNote: string;
  paidGrowth: {
    suggestedCampaignTypes: string[];
    keywordSeeds: string[];
    avoidBroadPpc: boolean;
  };
  /** Future: attach `amieResearchId` on CRM rows. */
  crmMetadata: { engine: "amie"; researchId?: number };
};

export type AmieFullAnalysis = {
  input: AmieMarketInput;
  marketData: AmieMarketDataDTO;
  opportunity: AmieOpportunityDTO;
  integrationHints: AmieIntegrationHints;
};
