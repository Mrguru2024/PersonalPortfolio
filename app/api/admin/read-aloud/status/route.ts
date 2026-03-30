import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { isGeminiConfigured } from "@server/services/googleGenaiClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await isAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const openaiTts = Boolean(process.env.OPENAI_API_KEY?.trim());
  const geminiTts = isGeminiConfigured();
  return NextResponse.json({ openaiTts, geminiTts });
}
