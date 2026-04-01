import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { resolveReadAloudTts } from "@shared/readAloudTtsConfig";
import { storage } from "@server/storage";
import { isGeminiConfigured } from "@server/services/googleGenaiClient";
import { getReadAloudTtsEnvDefaults } from "@server/services/readAloudTtsEnvDefaults";

export const dynamic = "force-dynamic";

/** GET /api/admin/read-aloud/status — provider availability + resolved TTS options for pickers. */
export async function GET(req: NextRequest) {
  const ok = await isAdmin(req);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const openaiTts = Boolean(process.env.OPENAI_API_KEY?.trim());
  const geminiTts = isGeminiConfigured();
  const user = await getSessionUser(req);
  const userId = user?.id != null ? Number(user.id) : null;
  const row = userId != null ? await storage.getAdminSettings(userId) : undefined;
  const envDefaults = getReadAloudTtsEnvDefaults();
  const resolved = resolveReadAloudTts(row?.ttsConfig ?? null, envDefaults);
  return NextResponse.json({ openaiTts, geminiTts, envDefaults, resolved });
}
