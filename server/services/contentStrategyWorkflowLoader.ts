import { readFile } from "fs/promises";
import path from "path";
import {
  CONTENT_STRATEGY_WORKFLOW_DEFAULT,
  type ContentStrategyWorkflowConfig,
} from "@shared/contentStrategyWorkflowConfig";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function deepMergeRecords(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out = { ...base };
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    const prev = base[key];
    if (isPlainObject(val) && isPlainObject(prev)) {
      out[key] = deepMergeRecords(prev, val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export function deepMergeContentStrategyWorkflow(
  base: ContentStrategyWorkflowConfig,
  patch: unknown,
): ContentStrategyWorkflowConfig {
  if (!isPlainObject(patch)) return base;
  return deepMergeRecords(
    { ...(base as unknown as Record<string, unknown>) },
    patch,
  ) as unknown as ContentStrategyWorkflowConfig;
}

export async function loadContentStrategyWorkflowConfig(): Promise<ContentStrategyWorkflowConfig> {
  let merged: ContentStrategyWorkflowConfig = {
    ...CONTENT_STRATEGY_WORKFLOW_DEFAULT,
    pillars: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.pillars],
    contentFormats: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.contentFormats],
    repurposeChannels: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.repurposeChannels],
    channelMixGuidance: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.channelMixGuidance],
    pillarFunnelBridge: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.pillarFunnelBridge],
    journeyStages: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.journeyStages],
    proChecklists: {
      prePublish: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.proChecklists.prePublish],
      seoAndDiscoverability: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.proChecklists.seoAndDiscoverability],
      repurposing: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.proChecklists.repurposing],
      governance: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.proChecklists.governance],
    },
    assistantDirectives: [...CONTENT_STRATEGY_WORKFLOW_DEFAULT.assistantDirectives],
  };
  const rel = process.env.ASCENDRA_CONTENT_STRATEGY_JSON?.trim();
  if (!rel) return merged;
  try {
    const abs = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    const raw = await readFile(abs, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    merged = deepMergeContentStrategyWorkflow(merged, parsed);
  } catch (e) {
    console.warn(
      "[contentStrategyWorkflow] Could not load ASCENDRA_CONTENT_STRATEGY_JSON:",
      rel,
      e instanceof Error ? e.message : e,
    );
  }
  return merged;
}

export function formatContentStrategyWorkflowForAgent(cfg: ContentStrategyWorkflowConfig): string {
  const lines: string[] = [
    "### EDITORIAL CONTENT STRATEGY WORKFLOW (calendar `strategy_meta` + reference PDF)",
    "",
    `**Reference:** [${cfg.sourceDocument.title}](${cfg.sourceDocument.publicPath})`,
    cfg.sourceDocument.note,
    "",
    "**Pillar ↔ funnel**",
    ...cfg.pillarFunnelBridge.map((p) => `- ${p}`),
    "",
    "**Content pillars**",
    ...cfg.pillars.map(
      (p) =>
        `- \`${p.id}\` **${p.label}**: ${p.objective}${p.exampleAngles?.length ? ` — e.g. ${p.exampleAngles.join("; ")}` : ""}`,
    ),
    "",
    "**Channel / editorial mix**",
    ...cfg.channelMixGuidance.map((c) => `- ${c}`),
    "",
    "**Buyer journey (content job per stage)**",
    ...cfg.journeyStages.map((j) => `- **${j.stage}**: ${j.contentJob}`),
    "",
    "**Pro checklists (coach admins)**",
    "- Pre-publish:",
    ...cfg.proChecklists.prePublish.map((x) => `  - ${x}`),
    "- SEO & discoverability:",
    ...cfg.proChecklists.seoAndDiscoverability.map((x) => `  - ${x}`),
    "- Repurposing:",
    ...cfg.proChecklists.repurposing.map((x) => `  - ${x}`),
    "- Governance:",
    ...cfg.proChecklists.governance.map((x) => `  - ${x}`),
    "",
    "**Assistant directives**",
    ...cfg.assistantDirectives.map((d) => `- ${d}`),
  ];
  return lines.join("\n");
}

export async function getContentStrategyWorkflowAgentSection(): Promise<string> {
  const cfg = await loadContentStrategyWorkflowConfig();
  return formatContentStrategyWorkflowForAgent(cfg);
}
