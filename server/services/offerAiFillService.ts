/**
 * AI draft for admin site offer editor (OpenAI). Optional: OPENAI_API_KEY.
 */

import OpenAI from "@server/openai/nodeClient";
import { z } from "zod";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!openai) openai = new OpenAI({ apiKey: key });
  return openai;
}

export function isOfferAiFillAvailable(): boolean {
  return getOpenAIClient() !== null;
}

/** Lucide icon names accepted by the offer editor dropdown. */
export const OFFER_DELIVERABLE_ICONS = [
  "FileText",
  "MessageSquare",
  "Map",
  "Layout",
  "ClipboardList",
  "CheckCircle2",
  "Target",
  "Zap",
  "Sparkles",
  "BarChart3",
  "Lightbulb",
  "Rocket",
] as const;

const iconSet = new Set<string>(OFFER_DELIVERABLE_ICONS);

function extractJsonObject(raw: string): unknown {
  const t = raw.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1]!.trim() : t;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model output");
  return JSON.parse(body.slice(start, end + 1));
}

/** Maps model output to an allowed Lucide name for the offer editor. */
export function normalizeOfferDeliverableIcon(raw: string): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  return iconSet.has(s) ? s : "FileText";
}

const offerAiFillSchema = z.object({
  name: z.string().min(1).max(300),
  metaTitle: z.string().max(300),
  metaDescription: z.string().max(500),
  hero: z.object({
    title: z.string().max(500),
    subtitle: z.string().max(4000),
    imageUrl: z.union([z.string(), z.null()]).optional(),
  }),
  price: z.object({
    label: z.string().max(200),
    amount: z.string().max(120),
    note: z.string().max(2000),
  }),
  deliverables: z
    .array(
      z.object({
        icon: z.string(),
        title: z.string().max(300),
        desc: z.string().max(2000),
        imageUrl: z.union([z.string(), z.null()]).optional(),
      }),
    )
    .min(3)
    .max(8),
  bullets: z.array(z.string().max(500)).min(3).max(10),
  cta: z.object({
    buttonText: z.string().max(200),
    buttonHref: z.string().max(500),
    footnote: z.string().max(1000),
  }),
  graphics: z
    .object({
      bannerUrl: z.union([z.string(), z.null()]).optional(),
    })
    .optional(),
});

export type OfferAiFillPayload = z.infer<typeof offerAiFillSchema>;

export interface GenerateOfferFromPromptInput {
  prompt: string;
  slug?: string;
  /** Optional JSON-safe snapshot so the model can revise instead of inventing from scratch. */
  currentOffer?: {
    name?: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    sections?: Record<string, unknown>;
  };
}

function stripIqFromSections(sections: Record<string, unknown>): Record<string, unknown> {
  const { iqTargeting: _iq, ...rest } = sections;
  return rest;
}

export async function generateOfferFieldsFromPrompt(input: GenerateOfferFromPromptInput): Promise<OfferAiFillPayload> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not set. AI offer fill is disabled.");
  }

  const prompt = input.prompt.trim().slice(0, 8000);
  if (!prompt) throw new Error("Prompt is required");

  const iconList = OFFER_DELIVERABLE_ICONS.join(", ");

  let currentBlock = "";
  if (input.currentOffer && Object.keys(input.currentOffer).length > 0) {
    const sec = input.currentOffer.sections
      ? stripIqFromSections(input.currentOffer.sections as Record<string, unknown>)
      : undefined;
    const snap = {
      name: input.currentOffer.name,
      metaTitle: input.currentOffer.metaTitle,
      metaDescription: input.currentOffer.metaDescription,
      sections: sec,
    };
    currentBlock = `\n\nCurrent offer (revise or replace per the operator instructions; you may keep structure):\n${JSON.stringify(snap).slice(0, 12000)}`;
  }

  const system = `You are a conversion copywriter for Ascendra Technologies, a web and growth agency.

Return a single JSON object only (no markdown fences). Keys and shape:
- "name": string, display name of the offer (not the URL slug).
- "metaTitle": string, ≤60 chars ideal for SEO title.
- "metaDescription": string, ≤155 chars ideal for meta description.
- "hero": { "title", "subtitle", "imageUrl" optional string or empty string }
- "price": { "label", "amount", "note" }
- "deliverables": array of 3–8 items { "icon", "title", "desc", optional "imageUrl" }
- "bullets": array of 3–8 short strings (value props).
- "cta": { "buttonText", "buttonHref", "footnote" } — buttonHref should be a site path like /strategy-call or /contact when appropriate.
- "graphics": optional { "bannerUrl" optional string }

Rules:
- Do NOT include iqTargeting, personaIds, or any IQ framework fields.
- For each deliverable "icon", use ONLY one of: ${iconList}
- Tone: clear, trustworthy, specific; avoid hype and fake urgency.
- If imageUrl/bannerUrl are unknown, use "" (empty string), not null.
- Subtitle and deliverable desc can be multiple sentences when helpful.`;

  const userMsg = `Offer URL slug (context only, do not repeat as the name unless asked): ${input.slug ?? "unknown"}

Operator instructions:
${prompt}${currentBlock}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.45,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: userMsg },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const json = extractJsonObject(raw);
  const parsed = offerAiFillSchema.safeParse(json);
  if (!parsed.success) {
    console.warn("[offerAiFill] schema failed", parsed.error.flatten());
    throw new Error("AI returned invalid offer shape. Try a simpler prompt or try again.");
  }

  const d = parsed.data;
  return {
    ...d,
    hero: {
      ...d.hero,
      imageUrl: d.hero.imageUrl === null || d.hero.imageUrl === undefined ? "" : String(d.hero.imageUrl).trim(),
    },
    deliverables: d.deliverables.map((x) => ({
      ...x,
      icon: normalizeOfferDeliverableIcon(x.icon),
      imageUrl:
        x.imageUrl === null || x.imageUrl === undefined ? undefined : String(x.imageUrl).trim() || undefined,
    })),
    graphics: {
      bannerUrl:
        d.graphics?.bannerUrl === null || d.graphics?.bannerUrl === undefined
          ? ""
          : String(d.graphics.bannerUrl).trim(),
    },
  };
}
