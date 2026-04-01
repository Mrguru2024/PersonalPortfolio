/**
 * Client-safe Phase 2 overlay for Conversion Diagnostics (no raw operational payloads).
 */
export interface ClientGrowthScores {
  conversionHealth: number;
  trafficQuality: number;
  funnelEfficiency: number;
  hints: string[];
}

export interface ClientPhase2Overlay {
  revenueSummary: {
    totalAttributedDisplay: string;
    periodNote: string;
    stripeLinkedNote?: string;
  };
  growthScores: ClientGrowthScores;
  predictiveNudges: string[];
  benchmarkSnapshot: string;
  roiHint?: string;
  personaInsight?: string;
  offerInsight?: string;
}
