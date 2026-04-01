import {
  GEMINI_TTS_PREBUILT_PAIRS,
  GEMINI_TTS_PREBUILT_VOICE_IDS,
} from "@shared/readAloudGeminiVoices";
import {
  OPENAI_TTS_VOICE_IDS,
  OPENAI_TTS_VOICE_META,
  READING_STYLES_TTS_DEFAULT,
} from "@shared/readAloudTtsBuiltins";

/** Per-admin overrides stored in `admin_settings.tts_config` (JSON). */
export type AdminTtsConfigStored = {
  /** Override OpenAI `model` for speech; empty = use env / platform default */
  openaiModel: string | null;
  /** Override Gemini TTS model id */
  geminiModel: string | null;
  /** Additional OpenAI voice ids (e.g. new API voices); merged with built-ins for validation + UI */
  openaiVoicesExtra: string[];
  /** Additional Gemini prebuilt voice names; merged with Google’s documented list */
  geminiVoicesExtra: string[];
};

export const DEFAULT_ADMIN_TTS_CONFIG: AdminTtsConfigStored = {
  openaiModel: null,
  geminiModel: null,
  openaiVoicesExtra: [],
  geminiVoicesExtra: [],
};

export type ReadAloudVoiceOption = { id: string; label: string; hint: string };

export type ResolvedReadAloudTts = {
  openai: { model: string; voices: ReadAloudVoiceOption[] };
  gemini: { model: string; voices: ReadAloudVoiceOption[] };
  readingStyles: string[];
};

const OPENAI_MODEL_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
const GEMINI_MODEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/;
const OPENAI_VOICE_EXTRA_RE = /^[a-z][a-z0-9_-]{0,31}$/;
const GEMINI_VOICE_EXTRA_RE = /^[A-Z][a-zA-Z0-9]{0,39}$/;
const MAX_EXTRAS = 24;

function normalizeOpenAiModel(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return OPENAI_MODEL_RE.test(s) ? s.toLowerCase() : null;
}

function normalizeGeminiModel(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return GEMINI_MODEL_RE.test(s) ? s : null;
}

function dedupeStrings(xs: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const t = x.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Parse + validate TTS overrides from API PATCH body. `null` clears stored overrides (env + built-ins only). */
export function sanitizeAdminTtsConfigPatch(raw: unknown): AdminTtsConfigStored | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const o = raw as Record<string, unknown>;
  const openaiModel = normalizeOpenAiModel(
    typeof o.openaiModel === "string" ? o.openaiModel : null,
  );
  const geminiModel = normalizeGeminiModel(
    typeof o.geminiModel === "string" ? o.geminiModel : null,
  );

  const openaiExtrasRaw = Array.isArray(o.openaiVoicesExtra)
    ? o.openaiVoicesExtra.filter((x): x is string => typeof x === "string")
    : [];
  const geminiExtrasRaw = Array.isArray(o.geminiVoicesExtra)
    ? o.geminiVoicesExtra.filter((x): x is string => typeof x === "string")
    : [];

  const openaiVoicesExtra = dedupeStrings(
    openaiExtrasRaw.filter((id) => OPENAI_VOICE_EXTRA_RE.test(id.trim().toLowerCase())),
    MAX_EXTRAS,
  ).map((s) => s.toLowerCase());

  const geminiVoicesExtra = dedupeStrings(
    geminiExtrasRaw.filter((id) => GEMINI_VOICE_EXTRA_RE.test(id.trim())),
    MAX_EXTRAS,
  );

  return {
    openaiModel,
    geminiModel,
    openaiVoicesExtra,
    geminiVoicesExtra,
  };
}

function mergeOpenAiVoices(extras: string[]): ReadAloudVoiceOption[] {
  const byId = new Map<string, ReadAloudVoiceOption>();
  for (const v of OPENAI_TTS_VOICE_META) {
    byId.set(v.id, { ...v });
  }
  for (const id of extras) {
    if (!byId.has(id)) {
      byId.set(id, { id, label: id, hint: "Custom" });
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function mergeGeminiVoices(extras: string[]): ReadAloudVoiceOption[] {
  const byId = new Map<string, ReadAloudVoiceOption>();
  for (const [id, hint] of GEMINI_TTS_PREBUILT_PAIRS) {
    byId.set(id, { id, label: id, hint });
  }
  for (const id of extras) {
    if (!byId.has(id)) {
      byId.set(id, { id, label: id, hint: "Custom" });
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Merge stored admin config with environment defaults (server calls with `process.env`). */
export function resolveReadAloudTts(
  stored: AdminTtsConfigStored | null | undefined,
  envDefaults: { openaiModel: string; geminiModel: string },
): ResolvedReadAloudTts {
  const cfg = stored ?? DEFAULT_ADMIN_TTS_CONFIG;
  const openaiModel = normalizeOpenAiModel(cfg.openaiModel) ?? envDefaults.openaiModel;
  const geminiModel = normalizeGeminiModel(cfg.geminiModel) ?? envDefaults.geminiModel;
  return {
    openai: {
      model: openaiModel,
      voices: mergeOpenAiVoices(cfg.openaiVoicesExtra ?? []),
    },
    gemini: {
      model: geminiModel,
      voices: mergeGeminiVoices(cfg.geminiVoicesExtra ?? []),
    },
    readingStyles: [...READING_STYLES_TTS_DEFAULT],
  };
}

/** Validate OpenAI voice id against built-ins + extras from stored config. */
export function isAllowedOpenAiVoice(
  voice: string,
  stored: AdminTtsConfigStored | null | undefined,
): boolean {
  const v = voice.toLowerCase().trim();
  if (OPENAI_TTS_VOICE_IDS.has(v)) return true;
  const extras = stored?.openaiVoicesExtra ?? [];
  return extras.some((e) => e.toLowerCase() === v);
}

/** Validate Gemini voice name against prebuilt list + extras. */
export function isAllowedGeminiVoice(voice: string, stored: AdminTtsConfigStored | null | undefined): boolean {
  const v = voice.trim();
  if (GEMINI_TTS_PREBUILT_VOICE_IDS.has(v)) return true;
  const extras = stored?.geminiVoicesExtra ?? [];
  return extras.some((e) => e === v);
}
