import { GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT } from "@shared/readAloudGeminiVoices";

export function getReadAloudTtsEnvDefaults(): { openaiModel: string; geminiModel: string } {
  return {
    openaiModel: process.env.OPENAI_READ_ALOUD_MODEL?.trim() || "tts-1",
    geminiModel: process.env.GEMINI_READ_ALOUD_TTS_MODEL?.trim() || GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT,
  };
}
