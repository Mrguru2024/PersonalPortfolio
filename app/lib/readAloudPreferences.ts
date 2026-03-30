/**
 * Client-only read-aloud settings (localStorage). Used by ReadAloudButton.
 */

import { GEMINI_TTS_PREBUILT_PAIRS } from "@shared/readAloudGeminiVoices";

export type ReadAloudEngine = "browser" | "openai" | "gemini";

export type ReadingStyleId = "natural" | "calm" | "clear" | "expressive";

export interface ReadAloudPreferences {
  engine: ReadAloudEngine;
  /** `SpeechSynthesisVoice.voiceURI` or empty = system default */
  browserVoiceUri: string;
  readingStyle: ReadingStyleId;
  /** OpenAI TTS voice (tts-1 / tts-1-hd) */
  openaiVoice: string;
  /** Gemini prebuilt voice name (e.g. Kore, Puck) */
  geminiVoice: string;
}

const STORAGE_KEY = "ascendra_read_aloud_prefs_v1";

export const DEFAULT_READ_ALOUD_PREFS: ReadAloudPreferences = {
  engine: "browser",
  browserVoiceUri: "",
  readingStyle: "natural",
  openaiVoice: "nova",
  geminiVoice: "Kore",
};

/** Gemini TTS voice picker (shared list with server allowlist). */
export const GEMINI_TTS_VOICES: { id: string; label: string; hint: string }[] =
  GEMINI_TTS_PREBUILT_PAIRS.map(([id, hint]) => ({ id, label: id, hint }));

export const READING_STYLE_META: Record<
  ReadingStyleId,
  { label: string; description: string; rate: number; pitch: number }
> = {
  natural: {
    label: "Natural",
    description: "Balanced pace",
    rate: 0.95,
    pitch: 1,
  },
  calm: {
    label: "Calm",
    description: "Slower, relaxed",
    rate: 0.85,
    pitch: 0.98,
  },
  clear: {
    label: "Clear",
    description: "Slower for clarity",
    rate: 0.8,
    pitch: 1.02,
  },
  expressive: {
    label: "Expressive",
    description: "Slightly quicker & lively",
    rate: 1.05,
    pitch: 1.05,
  },
};

/** OpenAI speech voices (https://platform.openai.com/docs/guides/text-to-speech) */
export const OPENAI_TTS_VOICES: { id: string; label: string; hint: string }[] = [
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

export function loadReadAloudPrefs(): ReadAloudPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_READ_ALOUD_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_READ_ALOUD_PREFS };
    const p = JSON.parse(raw) as Partial<ReadAloudPreferences>;
    const engine: ReadAloudEngine =
      p.engine === "openai" ? "openai" : p.engine === "gemini" ? "gemini" : "browser";
    return {
      ...DEFAULT_READ_ALOUD_PREFS,
      ...p,
      engine,
      browserVoiceUri: typeof p.browserVoiceUri === "string" ? p.browserVoiceUri : "",
      readingStyle:
        p.readingStyle && p.readingStyle in READING_STYLE_META ? p.readingStyle : "natural",
      openaiVoice:
        typeof p.openaiVoice === "string" && OPENAI_TTS_VOICES.some((x) => x.id === p.openaiVoice)
          ? p.openaiVoice
          : DEFAULT_READ_ALOUD_PREFS.openaiVoice,
      geminiVoice:
        typeof p.geminiVoice === "string" && GEMINI_TTS_VOICES.some((x) => x.id === p.geminiVoice)
          ? p.geminiVoice
          : DEFAULT_READ_ALOUD_PREFS.geminiVoice,
    };
  } catch {
    return { ...DEFAULT_READ_ALOUD_PREFS };
  }
}

export function saveReadAloudPrefs(prefs: ReadAloudPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

export function isLikelyNeuralBrowserVoice(v: SpeechSynthesisVoice): boolean {
  const blob = `${v.name} ${v.voiceURI}`.toLowerCase();
  return /natural|neural|premium|enhanced|wavenet|google offline|microsoft|aria|jenny|guy|sara|zira|mark|daniel/.test(
    blob,
  );
}

/** Sort: likely higher-quality / neural names first, then locale default, then name */
export function sortSpeechVoicesForAdmin(list: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return [...list].sort((a, b) => {
    const aN = isLikelyNeuralBrowserVoice(a) ? 0 : 1;
    const bN = isLikelyNeuralBrowserVoice(b) ? 0 : 1;
    if (aN !== bN) return aN - bN;
    if (a.lang !== b.lang) return a.lang.localeCompare(b.lang);
    return a.name.localeCompare(b.name);
  });
}
