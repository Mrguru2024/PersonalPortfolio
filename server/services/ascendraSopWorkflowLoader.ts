import { readFile } from "fs/promises";
import path from "path";
import {
  ASCENDRA_SOP_WORKFLOW_DEFAULT,
  type AscendraSopWorkflowConfig,
} from "@shared/ascendraSopWorkflowConfig";

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

/** Deep-merge `patch` onto `base`. Arrays and scalars from patch replace; plain objects recurse. */
export function deepMergeSopWorkflow(
  base: AscendraSopWorkflowConfig,
  patch: unknown,
): AscendraSopWorkflowConfig {
  if (!isPlainObject(patch)) return base;
  return deepMergeRecords(
    { ...(base as unknown as Record<string, unknown>) },
    patch,
  ) as unknown as AscendraSopWorkflowConfig;
}

export async function loadAscendraSopWorkflowConfig(): Promise<AscendraSopWorkflowConfig> {
  let merged: AscendraSopWorkflowConfig = { ...ASCENDRA_SOP_WORKFLOW_DEFAULT };
  const rel = process.env.ASCENDRA_SOP_WORKFLOW_JSON?.trim();
  if (!rel) return merged;
  try {
    const abs = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    const raw = await readFile(abs, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    merged = deepMergeSopWorkflow(ASCENDRA_SOP_WORKFLOW_DEFAULT, parsed);
  } catch (e) {
    console.warn(
      "[ascendraSopWorkflow] Could not load ASCENDRA_SOP_WORKFLOW_JSON:",
      rel,
      e instanceof Error ? e.message : e,
    );
  }
  return merged;
}

/** Markdown section appended to admin agent system context */
export function formatAscendraSopWorkflowForAgent(cfg: AscendraSopWorkflowConfig): string {
  const lines: string[] = [
    "### ASCENDRA DELIVERY SOP WORKFLOW (structured — aligns to Company SOP PDF)",
    "",
    `**Canonical PDF:** [${cfg.sourceDocument.title}](${cfg.sourceDocument.publicPath})`,
    cfg.sourceDocument.note,
    "",
    "**Operating principles**",
    ...cfg.operatingPrinciples.map((p) => `- ${p}`),
    "",
    "**Delivery phases (use when sequencing work or coaching)**",
  ];
  for (const ph of cfg.deliveryPhases) {
    lines.push(`- **${ph.name}** (\`${ph.id}\`): ${ph.summary}`);
    for (const o of ph.objectives) lines.push(`  - Objective: ${o}`);
    for (const g of ph.qualityGates) lines.push(`  - Gate: ${g}`);
    lines.push(
      `  - HVD hints: ${ph.suggestedHvdSlugs.join(", ") || "—"}; roles: ${ph.primaryRoleKeys.join(", ") || "—"}`,
    );
  }
  lines.push("", "**Acceptance & documentation norms**");
  lines.push("- Tasks:", ...cfg.acceptanceNorms.taskAcceptance.map((x) => `  - ${x}`));
  lines.push("- Documentation:", ...cfg.acceptanceNorms.documentationHandoff.map((x) => `  - ${x}`));
  lines.push("- Client comms:", ...cfg.acceptanceNorms.clientComms.map((x) => `  - ${x}`));
  lines.push("", "**Role playbook hints (Agency OS execution roles)**");
  for (const [roleKey, hint] of Object.entries(cfg.rolePlaybookHints)) {
    lines.push(`- **${roleKey}**`);
    for (const a of hint.sopAnchors) lines.push(`  - SOP: ${a}`);
    for (const w of hint.whenHelpingAdmin) lines.push(`  - Assistant: ${w}`);
  }
  lines.push("", "**Task templates (reference when proposing Agency OS tasks)**");
  for (const t of cfg.taskTemplates) {
    lines.push(`- \`${t.id}\`: **${t.title}** (HVD \`${t.primaryHvdSlug}\`, role ${t.suggestedRoleKey ?? "—"})`);
    lines.push(`  - ${t.briefingForAi}`);
    lines.push(`  - Outcome: ${t.expectedOutcomeHint}`);
    lines.push(`  - Metric: ${t.impactMetricHint}`);
  }
  lines.push("", "**Assistant directives (SOP-aware)**");
  lines.push(...cfg.assistantDirectives.map((d) => `- ${d}`));
  return lines.join("\n");
}

export async function getAscendraSopWorkflowAgentSection(): Promise<string> {
  const cfg = await loadAscendraSopWorkflowConfig();
  return formatAscendraSopWorkflowForAgent(cfg);
}
