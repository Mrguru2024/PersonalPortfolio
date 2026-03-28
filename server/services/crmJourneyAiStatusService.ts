/**
 * Optional OpenAI refinement for journey status (env-gated). Never downgrades; never sets won/lost from here.
 */

import OpenAI from "openai";
import type { CrmContact } from "@shared/crmSchema";
import { normalizeLeadContactStatus, CRM_LEAD_CONTACT_STATUS_ORDER } from "@server/lib/crmContactLifecycleStatus";
import type { WorkflowPayload } from "@server/services/workflows/types";
import { isSameOrForwardPipelineStatus } from "@server/lib/crmJourneyAutomation";

const PIPELINE = [...CRM_LEAD_CONTACT_STATUS_ORDER] as string[];

function aiEnabled(): boolean {
  const v = process.env.CRM_JOURNEY_AI_STATUS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/**
 * When CRM_JOURNEY_AI_STATUS is enabled, asks the model to confirm or nudge the rule-based status
 * by at most one pipeline step forward. Falls back to rule-based on any error.
 */
export async function refineJourneyStatusWithAiIfEnabled(input: {
  ruleBasedStatus: string | null;
  triggerType: string;
  payload: WorkflowPayload;
  contact: CrmContact;
}): Promise<string | null> {
  const { ruleBasedStatus, triggerType, payload, contact } = input;
  if (!ruleBasedStatus) return null;
  if (!aiEnabled()) return ruleBasedStatus;

  const client = getClient();
  if (!client) return ruleBasedStatus;

  const model = process.env.CRM_JOURNEY_AI_MODEL?.trim() || "gpt-4o-mini";
  const current = normalizeLeadContactStatus(contact.status);
  if (current === "won" || current === "lost") return null;

  const system = [
    "You help automate a B2B CRM contact lifecycle status.",
    `Allowed status values: ${PIPELINE.join(", ")}. Do not output won or lost.`,
    "Output a single JSON object only, no markdown: {\"status\":\"contacted\"} etc.",
    "Pick the best status that reflects the event. You may use the rule_based_next value, or move exactly ONE step forward on the pipeline list from the current status if the event clearly justifies it. Never move backward. If unsure, use rule_based_next.",
  ].join(" ");

  const user = JSON.stringify({
    trigger: triggerType,
    journey: payload.journeyEvent ?? null,
    contact: { name: contact.name, currentStatus: current },
    rule_based_next: ruleBasedStatus,
  });

  try {
    const res = await client.chat.completions.create({
      model,
      temperature: 0.15,
      max_tokens: 80,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { status?: string };
    const aiRaw = normalizeLeadContactStatus(parsed.status ?? "");
    if (aiRaw === "won" || aiRaw === "lost") return ruleBasedStatus;
    if (!PIPELINE.includes(aiRaw)) return ruleBasedStatus;
    if (!isSameOrForwardPipelineStatus(contact.status, aiRaw)) return ruleBasedStatus;

    const rule = normalizeLeadContactStatus(ruleBasedStatus);
    const ruleIdx = PIPELINE.indexOf(rule);
    const aiIdx = PIPELINE.indexOf(aiRaw);
    const curIdx = PIPELINE.indexOf(current);
    if (curIdx === -1 || aiIdx === -1) return ruleBasedStatus;
    if (aiIdx > ruleIdx + 1) return ruleBasedStatus;
    if (aiIdx < curIdx) return ruleBasedStatus;
    return aiRaw;
  } catch {
    return ruleBasedStatus;
  }
}
