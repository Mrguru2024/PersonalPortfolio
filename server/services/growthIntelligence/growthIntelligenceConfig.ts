/**
 * Environment-based intelligence mode. Default: mock without API keys, live when OpenAI is configured.
 */
export type IntelligenceProviderMode = "live" | "mock";

export function getGrowthIntelligenceMode(): IntelligenceProviderMode {
  const forced = process.env.GOS_INTELLIGENCE_MODE?.trim().toLowerCase();
  if (forced === "mock") return "mock";
  if (forced === "live") return "live";
  return process.env.OPENAI_API_KEY?.trim() ? "live" : "mock";
}

export function shouldAutoRunContentInsightOnSave(): boolean {
  return process.env.GOS_AUTO_CONTENT_INSIGHT_ON_SAVE === "true";
}

export function shouldAutoRunContentInsightOnSchedule(): boolean {
  return process.env.GOS_AUTO_CONTENT_INSIGHT_ON_SCHEDULE !== "false";
}
