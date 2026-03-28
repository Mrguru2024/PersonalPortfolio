import OpenAI from "openai";
import { z } from "zod";
import {
  getGrowthIntelligenceMode,
  getGosOpenAiModel,
  type IntelligenceProviderMode,
} from "./growthIntelligenceConfig";

export type ResearchItemKind =
  | "keyword"
  | "topic"
  | "phrase"
  | "headline_opportunity"
  | "angle"
  | "seasonal"
  | "platform_relevance";

export interface ResearchItemDraft {
  itemKind: ResearchItemKind;
  phrase: string;
  source: string;
  confidence: number;
  trendDirection: "up" | "down" | "flat" | "unknown";
  relevanceScore: number;
  audienceFit: string;
  suggestedUsage: string;
  relatedHeadlines: string[];
  relatedCtaOpportunities: string[];
  metadataJson: Record<string, unknown>;
}

export interface ResearchProviderContext {
  projectKey: string;
  seed: string;
  focus?: "keyword" | "topic" | "phrase" | "headline" | "mixed";
}

export interface ResearchProvider {
  readonly name: string;
  runDiscovery(ctx: ResearchProviderContext): Promise<ResearchItemDraft[]>;
}

let openai: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY?.trim()) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const batchSchema = z.object({
  items: z.array(
    z.object({
      itemKind: z.string(),
      phrase: z.string(),
      confidence: z.number().min(0).max(1).optional(),
      trendDirection: z.enum(["up", "down", "flat", "unknown"]).optional(),
      relevanceScore: z.number().min(0).max(100).optional(),
      audienceFit: z.string().optional(),
      suggestedUsage: z.string().optional(),
      relatedHeadlines: z.array(z.string()).optional(),
      relatedCtaOpportunities: z.array(z.string()).optional(),
    }),
  ),
});

export class MockResearchProvider implements ResearchProvider {
  readonly name = "mock_catalog";

  async runDiscovery(ctx: ResearchProviderContext): Promise<ResearchItemDraft[]> {
    const seed = ctx.seed.trim() || "growth marketing";
    const base = seed.toLowerCase();
    return [
      {
        itemKind: "keyword",
        phrase: `${base} strategy`,
        source: "mock:deterministic",
        confidence: 0.55,
        trendDirection: "up",
        relevanceScore: 72,
        audienceFit: "Founders scaling lead gen",
        suggestedUsage: "Pillar post + 3 social cut-downs",
        relatedHeadlines: [`Why ${seed} breaks at scale`, `${seed}: a 7-day sprint`],
        relatedCtaOpportunities: ["Book a funnel audit", "Download the lead magnet checklist"],
        metadataJson: { demo: true },
      },
      {
        itemKind: "topic",
        phrase: `${seed} + AI workflows`,
        source: "mock:deterministic",
        confidence: 0.62,
        trendDirection: "flat",
        relevanceScore: 68,
        audienceFit: "Operators automating content",
        suggestedUsage: "Newsletter deep-dive",
        relatedHeadlines: ["AI without losing your voice"],
        relatedCtaOpportunities: ["See the workflow template"],
        metadataJson: { demo: true },
      },
      {
        itemKind: "headline_opportunity",
        phrase: `Stop guessing: ${seed} metrics that matter`,
        source: "mock:deterministic",
        confidence: 0.48,
        trendDirection: "unknown",
        relevanceScore: 61,
        audienceFit: "Data-curious founders",
        suggestedUsage: "Hook for LinkedIn + landing subhead",
        relatedHeadlines: [],
        relatedCtaOpportunities: ["Get the metric worksheet"],
        metadataJson: { demo: true },
      },
    ];
  }
}

export class OpenAiResearchProvider implements ResearchProvider {
  readonly name = "openai";

  async runDiscovery(ctx: ResearchProviderContext): Promise<ResearchItemDraft[]> {
    const client = getClient();
    if (!client) return new MockResearchProvider().runDiscovery(ctx);

    const focus = ctx.focus ?? "mixed";
    const prompt = `Seed topic/keyword: "${ctx.seed}". Project: ${ctx.projectKey}.
Focus: ${focus}. Return JSON { "items": array of 8 objects with:
itemKind (keyword|topic|phrase|headline_opportunity|angle|seasonal|platform_relevance),
phrase, confidence 0-1, trendDirection (up|down|flat|unknown), relevanceScore 0-100,
audienceFit, suggestedUsage, relatedHeadlines (string[]), relatedCtaOpportunities (string[]).
Be specific to the seed; no placeholders like "TBD".`;

    const model = getGosOpenAiModel();
    let res: OpenAI.Chat.Completions.ChatCompletion;
    try {
      res = await client.chat.completions.create({
        model,
        temperature: 0.5,
        max_tokens: 3500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a content research analyst. JSON only.",
          },
          { role: "user", content: prompt },
        ],
      });
    } catch (e: unknown) {
      if (e instanceof OpenAI.APIError && (e.status === 403 || e.code === "model_not_found")) {
        throw new Error(
          `OpenAI rejected model "${model}" for this API key/project (403 / model_not_found). ` +
            `Fix: In platform.openai.com open your Project → check model access, or set GOS_OPENAI_MODEL to a model your project can use (for example gpt-4o).`,
        );
      }
      throw e;
    }

    const raw = res.choices[0]?.message?.content ?? '{"items":[]}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new MockResearchProvider().runDiscovery(ctx);
    }
    const safe = batchSchema.safeParse(parsed);
    if (!safe.success) return new MockResearchProvider().runDiscovery(ctx);

    return safe.data.items.map((it) => ({
      itemKind: (["keyword", "topic", "phrase", "headline_opportunity", "angle", "seasonal", "platform_relevance"].includes(
        it.itemKind,
      )
        ? it.itemKind
        : "phrase") as ResearchItemKind,
      phrase: it.phrase,
      source: "openai",
      confidence: it.confidence ?? 0.5,
      trendDirection: it.trendDirection ?? "unknown",
      relevanceScore: Math.round(it.relevanceScore ?? 50),
      audienceFit: it.audienceFit ?? "",
      suggestedUsage: it.suggestedUsage ?? "",
      relatedHeadlines: it.relatedHeadlines ?? [],
      relatedCtaOpportunities: it.relatedCtaOpportunities ?? [],
      metadataJson: {},
    }));
  }
}

export function resolveResearchProvider(mode: IntelligenceProviderMode): ResearchProvider {
  if (mode === "live" && getClient()) return new OpenAiResearchProvider();
  return new MockResearchProvider();
}

export function getResearchRunMode(): IntelligenceProviderMode {
  return getGrowthIntelligenceMode();
}
