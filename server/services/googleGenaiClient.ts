/**
 * Optional Gemini API client (@google/genai). Uses GEMINI_API_KEY from the environment.
 *
 * - **Pro (text / tools):** default `gemini-3.1-pro-preview` (Gemini 3 Pro preview is retired).
 * - **Live (WebSocket):** default `gemini-3.1-flash-live-preview` — call `getGoogleGenAI()?.live.connect({ model: getGeminiFlashLiveModelId(), ... })`.
 */
import { GoogleGenAI } from "@google/genai/node";
import {
  DEFAULT_GEMINI_FLASH_LIVE_MODEL,
  DEFAULT_GEMINI_PRO_MODEL,
} from "@shared/geminiModelIds";

let singleton: GoogleGenAI | null = null;

function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey());
}

/** Text/tool use Pro model id (override with GEMINI_MODEL_PRO or GEMINI_PRO_MODEL). */
export function getGeminiProModelId(): string {
  return (
    process.env.GEMINI_MODEL_PRO?.trim() ||
    process.env.GEMINI_PRO_MODEL?.trim() ||
    DEFAULT_GEMINI_PRO_MODEL
  );
}

/** Live API model id (override with GEMINI_MODEL_FLASH_LIVE or GEMINI_FLASH_LIVE_MODEL). */
export function getGeminiFlashLiveModelId(): string {
  return (
    process.env.GEMINI_MODEL_FLASH_LIVE?.trim() ||
    process.env.GEMINI_FLASH_LIVE_MODEL?.trim() ||
    DEFAULT_GEMINI_FLASH_LIVE_MODEL
  );
}

export function getGoogleGenAI(): GoogleGenAI | null {
  const key = apiKey();
  if (!key) return null;
  if (!singleton) {
    singleton = new GoogleGenAI({ apiKey: key });
  }
  return singleton;
}

/** Single-turn text generation with the configured Pro model. */
export async function geminiGenerateText(
  prompt: string,
  options?: { model?: string; maxOutputTokens?: number },
): Promise<{ text: string } | { error: string }> {
  const ai = getGoogleGenAI();
  if (!ai) {
    return { error: "GEMINI_API_KEY is not set." };
  }
  const model = options?.model ?? getGeminiProModelId();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { maxOutputTokens: options?.maxOutputTokens ?? 1024 },
    });
    const text = response.text ?? "";
    return { text };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}
