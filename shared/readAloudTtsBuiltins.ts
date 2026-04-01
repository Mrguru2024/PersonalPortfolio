/** Built-in OpenAI TTS voice ids and picker copy (shared by client + server). */
export const OPENAI_TTS_VOICE_META: { id: string; label: string; hint: string }[] = [
  { id: "nova", label: "Nova", hint: "Warm, conversational" },
  { id: "shimmer", label: "Shimmer", hint: "Clear, upbeat" },
  { id: "alloy", label: "Alloy", hint: "Neutral" },
  { id: "ash", label: "Ash", hint: "Soft" },
  { id: "coral", label: "Coral", hint: "Friendly" },
  { id: "echo", label: "Echo", hint: "Male, warm" },
  { id: "fable", label: "Fable", hint: "British, expressive" },
  { id: "onyx", label: "Onyx", hint: "Deep, firm" },
  { id: "sage", label: "Sage", hint: "Measured" },
  { id: "ballad", label: "Ballad", hint: "Warm narrative" },
];

export const OPENAI_TTS_VOICE_IDS = new Set(OPENAI_TTS_VOICE_META.map((v) => v.id));

/** Gemini / OpenAI neural read-aloud reading styles (prompt prefixes on Gemini path). */
export const READING_STYLES_TTS_DEFAULT = ["natural", "calm", "clear", "expressive"] as const;

export type BuiltinReadingStyleTts = (typeof READING_STYLES_TTS_DEFAULT)[number];
