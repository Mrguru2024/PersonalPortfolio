/**
 * Gemini API prebuilt TTS voices for admin read-aloud.
 * @see https://ai.google.dev/gemini-api/docs/speech-generation
 */
export const GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT = "gemini-2.5-flash-preview-tts" as const;

/** [voiceName, short hint from Google docs] */
export const GEMINI_TTS_PREBUILT_PAIRS = [
  ["Zephyr", "Bright"],
  ["Puck", "Upbeat"],
  ["Charon", "Informative"],
  ["Kore", "Firm"],
  ["Fenrir", "Excitable"],
  ["Leda", "Youthful"],
  ["Orus", "Firm"],
  ["Aoede", "Breezy"],
  ["Callirrhoe", "Easy-going"],
  ["Autonoe", "Bright"],
  ["Enceladus", "Breathy"],
  ["Iapetus", "Clear"],
  ["Umbriel", "Easy-going"],
  ["Algieba", "Smooth"],
  ["Despina", "Smooth"],
  ["Erinome", "Clear"],
  ["Algenib", "Gravelly"],
  ["Rasalgethi", "Informative"],
  ["Laomedeia", "Upbeat"],
  ["Achernar", "Soft"],
  ["Alnilam", "Firm"],
  ["Schedar", "Even"],
  ["Gacrux", "Mature"],
  ["Pulcherrima", "Forward"],
  ["Achird", "Friendly"],
  ["Zubenelgenubi", "Casual"],
  ["Vindemiatrix", "Gentle"],
  ["Sadachbia", "Lively"],
  ["Sadaltager", "Knowledgeable"],
  ["Sulafat", "Warm"],
] as const;

/** Allowlist for API — `Set<string>` so callers can validate runtime input. */
export const GEMINI_TTS_PREBUILT_VOICE_IDS: Set<string> = new Set(
  GEMINI_TTS_PREBUILT_PAIRS.map((row) => row[0] as string),
);

export type GeminiReadAloudVoiceId = (typeof GEMINI_TTS_PREBUILT_PAIRS)[number][0];
