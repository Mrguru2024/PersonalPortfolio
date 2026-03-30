/**
 * Gemini preview TTS for admin read-aloud (PCM → WAV for browser playback).
 */
import { Modality } from "@google/genai/node";
import {
  GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT,
  GEMINI_TTS_PREBUILT_VOICE_IDS,
} from "@shared/readAloudGeminiVoices";
import { getGoogleGenAI } from "./googleGenaiClient";

const STYLE_PREFIX: Record<string, string> = {
  natural: "Read aloud in a natural, clear tone:",
  calm: "Read aloud calmly and at a relaxed pace:",
  clear: "Read aloud slowly and very clearly:",
  expressive: "Read aloud with light energy and expression:",
};

function pcm16leToWav(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const header = Buffer.alloc(44);
  const dataLen = pcm.length;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * 2, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLen, 40);
  return Buffer.concat([header, pcm]);
}

export async function synthesizeGeminiReadAloud(options: {
  text: string;
  voiceName: string;
  readingStyle?: string;
}): Promise<{ ok: true; wav: Buffer } | { ok: false; error: string }> {
  const ai = getGoogleGenAI();
  if (!ai) {
    return { ok: false, error: "GEMINI_API_KEY is not set" };
  }

  const rawVoice = options.voiceName.trim();
  const voiceName = rawVoice && GEMINI_TTS_PREBUILT_VOICE_IDS.has(rawVoice) ? rawVoice : "Kore";

  const styleKey =
    options.readingStyle && options.readingStyle in STYLE_PREFIX ? options.readingStyle : "natural";
  const prefix = STYLE_PREFIX[styleKey] ?? STYLE_PREFIX.natural;
  const prompt = `${prefix}\n\n${options.text}`;

  const model =
    process.env.GEMINI_READ_ALOUD_TTS_MODEL?.trim() || GEMINI_READ_ALOUD_TTS_MODEL_DEFAULT;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0] as
      | { inlineData?: { data?: string }; inline_data?: { data?: string } }
      | undefined;
    const b64 = part?.inlineData?.data ?? part?.inline_data?.data;

    if (typeof b64 !== "string" || !b64) {
      return { ok: false, error: "No audio in Gemini response" };
    }

    const pcm = Buffer.from(b64, "base64");
    return { ok: true, wav: pcm16leToWav(pcm) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[gemini read-aloud tts]", message);
    return { ok: false, error: message };
  }
}
