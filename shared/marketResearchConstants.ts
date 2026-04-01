export const MARKET_RESEARCH_SOURCE_KEYS = [
  "google_trends",
  "google_ads_keyword_planner",
  "reddit",
  "meta_ads_manual",
  "competitor_website",
  "manual_input",
] as const;

export type MarketResearchSourceKey = (typeof MARKET_RESEARCH_SOURCE_KEYS)[number];

export const MARKET_RESEARCH_SCORE_DIMENSIONS = [
  "demand",
  "pain_severity",
  "competition",
  "offer_gap",
  "ppc_viability",
  "seo_opportunity",
  "outbound_potential",
  "monetization",
  "confidence_score",
] as const;
