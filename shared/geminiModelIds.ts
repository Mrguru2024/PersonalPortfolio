/**
 * Gemini API model codes (Google AI for Developers / AI Studio).
 * @see https://ai.google.dev/gemini-api/docs/models
 */

/** Current Pro-tier preview; replaces shut-down `gemini-3-pro-preview`. */
export const GEMINI_MODEL_3_1_PRO_PREVIEW = "gemini-3.1-pro-preview" as const;

/**
 * @deprecated `gemini-3-pro-preview` was shut down March 2026. Use {@link GEMINI_MODEL_3_1_PRO_PREVIEW}.
 */
export const GEMINI_MODEL_3_PRO_PREVIEW_DEPRECATED = "gemini-3-pro-preview" as const;

/** Live API (low-latency voice / realtime). Use `GoogleGenAI.live.connect` — not `generateContent`. */
export const GEMINI_MODEL_3_1_FLASH_LIVE_PREVIEW = "gemini-3.1-flash-live-preview" as const;

export const DEFAULT_GEMINI_PRO_MODEL = GEMINI_MODEL_3_1_PRO_PREVIEW;
export const DEFAULT_GEMINI_FLASH_LIVE_MODEL = GEMINI_MODEL_3_1_FLASH_LIVE_PREVIEW;
