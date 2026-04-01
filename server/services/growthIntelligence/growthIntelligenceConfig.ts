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

/**
 * Chat model for Growth OS research + content insight jobs.
 * Default is gpt-4o-mini; some OpenAI **projects** return 403 until you enable that model or set this to one you already use (e.g. gpt-4o).
 */
export function getGosOpenAiModel(): string {
  return process.env.GOS_OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/**
 * Admin assistant + vision (default gpt-4o).
 * If your OpenAI project returns 403 for this model, set `OPENAI_ADMIN_AGENT_MODEL` to one you have access to (e.g. gpt-4o-mini — supports vision for screenshots).
 */
export function getAdminAgentOpenAiModel(): string {
  return process.env.OPENAI_ADMIN_AGENT_MODEL?.trim() || "gpt-4o";
}
