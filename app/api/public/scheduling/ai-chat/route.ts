import { NextRequest, NextResponse } from "next/server";
import { listActiveBookingTypes, getSchedulingSettings } from "@server/services/schedulingService";
import { aiBookingAssistantReply } from "@server/services/schedulingAiService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const settings = await getSchedulingSettings();
    if (!settings.publicBookingEnabled || !settings.aiAssistantEnabled) {
      return NextResponse.json({ error: "Assistant disabled" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const normalized = messages
      .filter((m: unknown) => m && typeof m === "object" && "role" in m && "content" in m)
      .slice(-8)
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: String(m.content ?? "").slice(0, 2000),
      }));
    const lastUser = [...normalized].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "messages[].user content required" }, { status: 400 });
    }

    const types = await listActiveBookingTypes();
    const meetingTypesSummary = types.map((t) => `- ${t.name} (${t.durationMinutes} min): ${t.description || "—"}`).join("\n");

    const reply = await aiBookingAssistantReply({
      messages: normalized,
      meetingTypesSummary: meetingTypesSummary || "General meeting",
    });
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[public/scheduling/ai-chat]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
