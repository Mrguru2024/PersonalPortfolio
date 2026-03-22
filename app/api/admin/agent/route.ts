import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { processAgentMessage, type AgentChatTurn } from "@server/services/adminAgentService";
import {
  ADMIN_AGENT_MENTOR_POLICY,
  buildPersonalizedGreetingLine,
  emptyMentorState,
  firstNameFromUser,
  mergeMentorStateAfterExchange,
  parseStoredMentorState,
} from "@server/services/adminAgentMentorService";

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

function persistMentorMerge(
  userId: number,
  baseState: ReturnType<typeof emptyMentorState>,
  userMessage: string,
  assistantReply: string,
): void {
  void (async () => {
    try {
      const merged = await mergeMentorStateAfterExchange(baseState, userMessage, assistantReply);
      await storage.upsertAdminAgentMentorState(userId, merged);
    } catch (e) {
      console.warn("[admin agent] mentor merge persist failed", e);
    }
  })();
}

/** GET /api/admin/agent — personalized greeting + policy for the admin mentor widget. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const userId = user?.id != null ? Number(user.id) : null;
    if (userId == null) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const row = await storage.getAdminAgentMentorState(userId);
    const state = row ? parseStoredMentorState(row.state) : null;
    const mentorNudge = state?.pendingMentorNudges?.[0] ?? null;
    return NextResponse.json({
      greetingLine: buildPersonalizedGreetingLine(firstNameFromUser(user)),
      mentorNudge,
      policyNotice: ADMIN_AGENT_MENTOR_POLICY,
    });
  } catch (e) {
    console.error("GET admin agent error:", e);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
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

    const firstName = firstNameFromUser(user);
    if (!message) {
      return NextResponse.json({
        reply: `${buildPersonalizedGreetingLine(firstName)} Send a message to continue — try “open reminders”, “go to CRM”, or ask me to explain something (I can pull live web sources when teaching).`,
      });
    }

    const settings = await storage.getAdminSettings(userId);
    const canPerformActions = settings?.aiAgentCanPerformActions === true;

    const mentorRow = await storage.getAdminAgentMentorState(userId);
    const mentorParsed = mentorRow ? parseStoredMentorState(mentorRow.state) : null;
    const mentorState = mentorParsed ?? emptyMentorState();

    const result = await processAgentMessage({
      message,
      canPerformActions,
      currentPath,
      openaiAvailable: !!process.env.OPENAI_API_KEY,
      history,
      userId,
      operatorDisplayName: firstName,
      mentorState,
    });

    if (process.env.OPENAI_API_KEY) {
      persistMentorMerge(userId, mentorState, message, result.reply);
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("POST admin agent error:", e);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
