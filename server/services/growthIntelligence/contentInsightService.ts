import OpenAI from "openai";
import { z } from "zod";
import { db } from "@server/db";
import {
  internalContentInsightRuns,
  internalContentInsightScores,
  internalContentAiSuggestions,
  internalCmsDocuments,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { getDocument } from "@server/services/internalStudio/cmsService";
import {
  CONTENT_INSIGHT_DIMENSION_KEYS,
  type ContentInsightDimensionKey,
} from "./contentInsightDimensions";
import {
  getGrowthIntelligenceMode,
  getGosOpenAiModel,
  type IntelligenceProviderMode,
} from "./growthIntelligenceConfig";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY?.trim()) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

const scoreDetailSchema = z.object({
  score: z.number().min(0).max(100),
  internal_rationale: z.string().optional(),
  client_safe_hint: z.string().optional(),
});

const aiInsightSchema = z.object({
  score_details: z.record(scoreDetailSchema).optional(),
  suggestions: z
    .array(
      z.object({
        kind: z.string(),
        title: z.string(),
        body: z.string(),
        client_excerpt: z.string().optional(),
        platform: z.string().nullable().optional(),
      }),
    )
    .optional(),
  consolidated_internal_rationale: z.string().optional(),
});

function mockInsightPayload(docTitle: string, plain: string): z.infer<typeof aiInsightSchema> {
  const sample = plain.slice(0, 200) || docTitle;
  const details: Record<string, z.infer<typeof scoreDetailSchema>> = {};
  for (const k of CONTENT_INSIGHT_DIMENSION_KEYS) {
    const base = 55 + (sample.length % 17);
    details[k] = {
      score: Math.min(88, Math.max(42, base)),
      internal_rationale: `[mock] Heuristic sample for ${k} based on length and title.`,
      client_safe_hint:
        k === "cta_strength"
          ? "Consider a clearer next step for the reader."
          : "Continue refining for your primary audience.",
    };
  }
  return {
    score_details: details,
    consolidated_internal_rationale:
      "[mock] Demo mode — set OPENAI_API_KEY and GOS_INTELLIGENCE_MODE=live for model-backed analysis.",
    suggestions: [
      {
        kind: "stronger_hook",
        title: "Open with a sharper tension hook",
        body: `Try leading with the specific pain implied in: "${docTitle.slice(0, 80)}…"`,
        client_excerpt: "Lead with the sharpest pain point before the solution.",
        platform: null,
      },
      {
        kind: "cta",
        title: "Strengthen the CTA",
        body: "Use one primary CTA with outcome language and a deadline or reason to act now.",
        client_excerpt: "One clear CTA with a specific outcome.",
        platform: null,
      },
      {
        kind: "platform_variant",
        title: "LinkedIn variant (shorter)",
        body: "3 lines: hook, proof point, CTA with link.",
        client_excerpt: "Short LinkedIn version: hook → proof → CTA.",
        platform: "linkedin",
      },
    ],
  };
}

async function runOpenAiInsight(docTitle: string, plain: string): Promise<z.infer<typeof aiInsightSchema>> {
  const client = getOpenAIClient();
  if (!client) return mockInsightPayload(docTitle, plain);

  const dims = CONTENT_INSIGHT_DIMENSION_KEYS.join(", ");
  const user = `Document title: ${docTitle}\n\nBody (plain text):\n${plain}\n\nReturn JSON with:
- score_details: object keyed by EXACTLY these dimension keys: ${dims}. Each value: { "score": 0-100 number, "internal_rationale": string (for internal strategists only), "client_safe_hint": string (short, no methodology) }.
- suggestions: array of { "kind": one of stronger_hook, headline, cta, pain_framing, outcome_phrasing, platform_variant, repurpose, "title", "body", "client_excerpt" (optional), "platform" (optional) } with at least 4 items.
- consolidated_internal_rationale: single string summarizing internal diagnosis (never show to clients).`;

  const res = await client.chat.completions.create({
    model: getGosOpenAiModel(),
    temperature: 0.35,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior growth copy strategist. Output valid JSON only. Scores must be integers 0-100. Internal rationale may include methodology; client_safe_hint must be generic and non-leaky.",
      },
      { role: "user", content: user },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return mockInsightPayload(docTitle, plain);
  }
  const safe = aiInsightSchema.safeParse(parsed);
  if (!safe.success) return mockInsightPayload(docTitle, plain);
  return safe.data;
}

export async function runContentInsightAnalysis(input: {
  documentId: number;
  triggerType: "manual" | "on_save" | "on_schedule" | "automation";
  triggeredByUserId: number | null;
  calendarEntryId?: number | null;
}): Promise<{ runId: number; providerMode: IntelligenceProviderMode }> {
  const doc = await getDocument(input.documentId);
  if (!doc) throw new Error("Document not found");

  const mode = getGrowthIntelligenceMode();
  const effectiveMode: IntelligenceProviderMode =
    mode === "live" && !getOpenAIClient() ? "mock" : mode;

  const [run] = await db
    .insert(internalContentInsightRuns)
    .values({
      documentId: input.documentId,
      calendarEntryId: input.calendarEntryId ?? null,
      projectKey: doc.projectKey,
      triggerType: input.triggerType,
      providerMode: effectiveMode,
      status: "pending",
      triggeredByUserId: input.triggeredByUserId,
      internalMetadataJson: {},
    })
    .returning();

  if (!run) throw new Error("Failed to create insight run");

  try {
    const plain = stripHtml(doc.bodyHtml || "");
    const payload =
      effectiveMode === "mock"
        ? mockInsightPayload(doc.title, plain)
        : await runOpenAiInsight(doc.title, plain);

    const details = payload.score_details ?? {};
    for (const key of CONTENT_INSIGHT_DIMENSION_KEYS) {
      const row = details[key] ?? { score: 50, internal_rationale: "No model output for dimension." };
      await db.insert(internalContentInsightScores).values({
        runId: run.id,
        dimensionKey: key,
        score: Math.round(row.score),
        internalRationale: row.internal_rationale ?? null,
        clientSafeHint: row.client_safe_hint ?? null,
      });
    }

    const suggestions = payload.suggestions ?? [];
    for (const s of suggestions) {
      await db.insert(internalContentAiSuggestions).values({
        documentId: input.documentId,
        insightRunId: run.id,
        suggestionKind: s.kind || "other",
        platformTarget: s.platform ?? null,
        title: s.title,
        body: s.body,
        clientSafeExcerpt: s.client_excerpt ?? null,
        internalTraceJson: { source: "content_insight_engine", providerMode: effectiveMode },
        reviewStatus: "pending",
      });
    }

    await db
      .update(internalContentInsightRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        internalMetadataJson: {
          consolidatedInternalRationale: payload.consolidated_internal_rationale ?? null,
          contentLength: plain.length,
        },
      })
      .where(eq(internalContentInsightRuns.id, run.id));

    return { runId: run.id, providerMode: effectiveMode };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await db
      .update(internalContentInsightRuns)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: msg,
      })
      .where(eq(internalContentInsightRuns.id, run.id));
    throw e;
  }
}

export async function listInsightRunsForDocument(documentId: number, limit = 20) {
  return db
    .select()
    .from(internalContentInsightRuns)
    .where(eq(internalContentInsightRuns.documentId, documentId))
    .orderBy(desc(internalContentInsightRuns.startedAt))
    .limit(limit);
}

export async function getInsightRunDetail(runId: number) {
  const [run] = await db
    .select()
    .from(internalContentInsightRuns)
    .where(eq(internalContentInsightRuns.id, runId))
    .limit(1);
  if (!run) return null;
  const scores = await db
    .select()
    .from(internalContentInsightScores)
    .where(eq(internalContentInsightScores.runId, runId));
  return { run, scores };
}

export async function listSuggestionsForDocument(documentId: number, limit = 50) {
  return db
    .select()
    .from(internalContentAiSuggestions)
    .where(eq(internalContentAiSuggestions.documentId, documentId))
    .orderBy(desc(internalContentAiSuggestions.createdAt))
    .limit(limit);
}

export async function updateSuggestionReview(
  id: number,
  patch: {
    reviewStatus?: string;
    editedBody?: string | null;
    reviewedByUserId?: number | null;
  },
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.reviewStatus !== undefined) updates.reviewStatus = patch.reviewStatus;
  if (patch.editedBody !== undefined) updates.editedBody = patch.editedBody;
  if (patch.reviewedByUserId !== undefined) updates.reviewedByUserId = patch.reviewedByUserId;
  if (patch.reviewStatus !== undefined && patch.reviewStatus !== "pending") {
    updates.reviewedAt = new Date();
  }
  const [row] = await db
    .update(internalContentAiSuggestions)
    .set(updates as never)
    .where(eq(internalContentAiSuggestions.id, id))
    .returning();
  return row ?? null;
}

export async function countPendingSuggestionsForProject(projectKey: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(internalContentAiSuggestions)
    .innerJoin(internalCmsDocuments, eq(internalContentAiSuggestions.documentId, internalCmsDocuments.id))
    .where(
      and(
        eq(internalContentAiSuggestions.reviewStatus, "pending"),
        eq(internalCmsDocuments.projectKey, projectKey),
      ),
    );
  return Number(r?.n ?? 0);
}
