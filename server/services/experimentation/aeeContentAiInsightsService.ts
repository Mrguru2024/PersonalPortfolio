/**
 * AI layer for content/campaign experimentation — interprets AEE rollups + admin-stated goals.
 * Grounds suggestions in provided numbers only; flags uncertainty when samples are thin.
 */
import OpenAI from "@server/openai/nodeClient";
import { z } from "zod";
import type { AeeRecommendation, VariantMetricRollup } from "./aeeInsightEngine";

let openai: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY?.trim()) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

export function getExperimentInsightsModel(): string {
  return (
    process.env.OPENAI_EXPERIMENT_INSIGHTS_MODEL?.trim() ||
    process.env.OPENAI_ADMIN_AGENT_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

const contentInsightsOutputSchema = z.object({
  executiveSummary: z.string(),
  insights: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      confidence: z.enum(["high", "medium", "low"]).optional(),
    }),
  ),
  recommendedContentChanges: z.array(
    z.object({
      surface: z.string(),
      action: z.string(),
      rationale: z.string(),
    }),
  ),
  nextMeasurementSteps: z.array(z.string()),
  caveats: z.array(z.string()),
});

export type AeeContentAiInsightsResult = z.infer<typeof contentInsightsOutputSchema>;

export type AeeContentAiInsightsInput = {
  experiment: {
    name: string;
    key: string;
    hypothesis: string | null;
    funnelStage: string | null;
    offerType: string | null;
    status: string;
    experimentTemplateKey: string | null;
  };
  variants: Array<{
    key: string;
    name: string;
    isControl: boolean | null;
    allocationWeight: number | null;
  }>;
  rollups: VariantMetricRollup[];
  recommendations: AeeRecommendation[];
  experimentScore: {
    score: number;
    confidence0to100: number;
    factors: { conversionLift: number; revenueIndex: number; sampleStrength: number };
  } | null;
  goal: string | null | undefined;
  primaryChannel: string | null | undefined;
  channelMetrics: {
    openRate?: number;
    clickRate?: number;
    sendCount?: number;
    notes?: string;
  } | null | undefined;
};

function stripJsonFence(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return t;
}

export async function generateAeeContentExperimentInsights(
  input: AeeContentAiInsightsInput,
): Promise<{ ok: true; data: AeeContentAiInsightsResult } | { ok: false; error: string }> {
  const client = getClient();
  if (!client) {
    return { ok: false, error: "OPENAI_API_KEY is not configured." };
  }

  const facts = {
    experiment: input.experiment,
    variants: input.variants,
    rollups: input.rollups.map((r) => ({
      variantKey: r.variantKey,
      variantName: r.variantName,
      visitors: r.visitors,
      leads: r.leads,
      revenueCents: r.revenueCents,
      costCents: r.costCents,
      ctr: r.ctr,
      convRate: r.convRate,
    })),
    ruleBasedRecommendations: input.recommendations,
    experimentScore: input.experimentScore,
    adminGoal: input.goal?.trim() || null,
    primaryChannel: input.primaryChannel || null,
    channelMetrics: input.channelMetrics ?? null,
  };

  const system = `You are Ascendra's content and growth experimentation analyst. Your job is to help admins decide what content (newsletters, site copy, social posts, ads) to change based on A/B test data.

Rules:
- Use ONLY the numbers and labels in the user message JSON. Do not invent visitor counts, conversion rates, or revenue.
- If samples are very small (e.g. under ~20 visitors per variant and no leads), emphasize uncertainty in caveats and avoid declaring a "winner."
- Tie suggestions to the admin's stated goal when present (e.g. more demo bookings, higher reply rate).
- Surfaces may include: website / landing, newsletter/email, social organic, paid ads — be specific.
- Output a single JSON object with this exact shape (no markdown fences):
{
  "executiveSummary": "string, 2-4 sentences",
  "insights": [ { "title": "string", "detail": "string", "confidence": "high" | "medium" | "low" } ],
  "recommendedContentChanges": [ { "surface": "string", "action": "string", "rationale": "string" } ],
  "nextMeasurementSteps": [ "string" ],
  "caveats": [ "string" ]
}`;

  const user = `FACTS_JSON:\n${JSON.stringify(facts)}`;

  const model = getExperimentInsightsModel();

  try {
    const res = await client.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user.slice(0, 100_000) },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const cleaned = stripJsonFence(raw);
    const parsed = JSON.parse(cleaned) as unknown;
    const out = contentInsightsOutputSchema.safeParse(parsed);
    if (!out.success) {
      console.warn("[aee content ai] schema miss", out.error.flatten());
      return { ok: false, error: "Model returned an unexpected format. Try again." };
    }
    return { ok: true, data: out.data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed";
    console.error("[aee content ai]", e);
    return { ok: false, error: msg };
  }
}
