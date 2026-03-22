import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { processAgentMessage, type AgentChatTurn } from "@server/services/adminAgentService";

export const dynamic = "force-dynamic";

function parseAgentHistory(raw: unknown): AgentChatTurn[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: AgentChatTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== "object") continue;
    const role = (t as { role?: string }).role;
    const content = (t as { content?: string }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string") {
      out.push({ role, content: content.slice(0, 4000) });
    }
  }
  return out.length > 0 ? out : undefined;
}

/** POST /api/admin/agent — chat with admin AI agent; may return an action to run if permitted. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const currentPath = typeof body.currentPath === "string" ? body.currentPath : undefined;
    const history = parseAgentHistory(body.history);

    if (!message) {
      return NextResponse.json({ reply: "Send a message to get started. Try “open reminders” or “go to CRM”." });
    }

    const settings = await storage.getAdminSettings(userId);
    const canPerformActions = settings?.aiAgentCanPerformActions === true;

    const result = await processAgentMessage({
      message,
      canPerformActions,
      currentPath,
      openaiAvailable: !!process.env.OPENAI_API_KEY,
      history,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("POST admin agent error:", e);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
