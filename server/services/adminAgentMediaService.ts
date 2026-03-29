/**
 * Vision interpretation for the admin assistant: images + optional text → structured understanding.
 */

import "openai/shims/node";
import OpenAI from "openai";
import { getAdminAgentOpenAiModel } from "@server/services/growthIntelligence/growthIntelligenceConfig";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function parseImageDataUrls(raw: unknown): { ok: true; dataUrls: string[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, dataUrls: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "imageAttachments must be an array" };
  const urls = raw.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, MAX_IMAGES);
  for (const u of urls) {
    const m = u.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
    if (!m) {
      return { ok: false, error: "Each image must be a data URL: data:image/png|jpeg|webp|gif;base64,..." };
    }
    const b64 = m[2];
    const buf = Buffer.from(b64, "base64");
    if (buf.length > MAX_IMAGE_BYTES) {
      return { ok: false, error: `Each image must be under ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.` };
    }
  }
  return { ok: true, dataUrls: urls };
}

export interface MediaAugmentationResult {
  augmentedMessage: string;
  /** Short summary shown in the assistant UI (what was understood from media). */
  mediaInterpretation: string;
}

/**
 * Combines optional user text with a vision analysis of uploaded images for the admin agent pipeline.
 */
export async function augmentAdminAgentMessageWithMedia(input: {
  message: string;
  imageDataUrls: string[];
}): Promise<MediaAugmentationResult | null> {
  const { message, imageDataUrls } = input;
  if (imageDataUrls.length === 0) {
    return null;
  }

  const openai = getClient();
  if (!openai) {
    const fallback =
      message.trim().length > 0
        ? message
        : "The user attached image(s) but image analysis is unavailable (OpenAI is not configured). Ask them to describe the request in text.";
    return {
      augmentedMessage: fallback,
      mediaInterpretation: "Images were attached; vision analysis requires OPENAI_API_KEY.",
    };
  }

  const userText = message.trim() || "(No text — infer intent only from the image(s).)";

  try {
    const completion = await openai.chat.completions.create({
      model: getAdminAgentOpenAiModel(),
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You help operators of the Ascendra Technologies admin CMS (CRM, content, analytics, Growth OS, Ascendra Intelligence).
Read image(s) carefully: transcribe visible text (OCR) exactly; describe UI screenshots (labels, URLs, errors).
Output a single JSON object with keys:
- "mediaInterpretation": 2–4 sentences in plain language for the operator (what you see + what they likely want). Use correct product spelling: Ascendra, Ascendra Intelligence, Growth OS, Content Studio, CRM.
- "inferredGoal": one concise sentence: what the operator wants done in the app or what they are asking.
- "mergedPrompt": one string combining inferredGoal with any important OCR or UI details, suitable as the user's message to an admin assistant (English, imperative or question form).`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Operator typed:\n${userText}` },
            ...imageDataUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as {
      mediaInterpretation?: string;
      inferredGoal?: string;
      mergedPrompt?: string;
    };
    const mediaInterpretation =
      typeof parsed.mediaInterpretation === "string" ? parsed.mediaInterpretation.trim().slice(0, 2000) : "";
    const merged =
      typeof parsed.mergedPrompt === "string" && parsed.mergedPrompt.trim().length > 0
        ? parsed.mergedPrompt.trim().slice(0, 6000)
        : typeof parsed.inferredGoal === "string"
          ? parsed.inferredGoal.trim().slice(0, 4000)
          : message.trim();

    if (!merged) {
      return {
        augmentedMessage: message.trim() || "Describe what you would like to do in the admin.",
        mediaInterpretation: mediaInterpretation || "Could not read a clear request from the image(s).",
      };
    }

    return {
      augmentedMessage: merged,
      mediaInterpretation: mediaInterpretation || merged.slice(0, 400),
    };
  } catch (e) {
    console.error("adminAgentMediaService vision error:", e);
    return {
      augmentedMessage:
        message.trim() ||
        "The user attached image(s) but analysis failed. Ask them to retry or describe the task in text.",
      mediaInterpretation: "Image analysis failed; please try again or add a short text description.",
    };
  }
}
