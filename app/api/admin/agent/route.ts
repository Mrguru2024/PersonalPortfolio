import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  describeAgentActionForUser,
  processAgentMessage,
  type AgentChatTurn,
} from "@server/services/adminAgentService";
import { augmentAdminAgentMessageWithMedia, parseImageDataUrls } from "@server/services/adminAgentMediaService";
import {
  formatKnowledgeForAgentPrompt,
  formatResearchBlockForAgentPrompt,
} from "@server/services/adminAgentKnowledgeContext";
import {
  ADMIN_AGENT_MENTOR_POLICY,
  buildPersonalizedGreetingLine,
  emptyMentorState,
  firstNameFromUser,
  mergeMentorStateAfterExchange,
  parseStoredMentorState,
} from "@server/services/adminAgentMentorService";

export const dynamic = "force-dynamic";

async function safeDbRead<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.warn(`[admin agent] ${label} read failed; using fallback`, error);
    return fallback;
  }
}

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
  baseState: import("@server/services/adminAgentMentorService").AdminMentorWorkingState,
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
    const settings = await safeDbRead(
      "admin_settings",
      () => storage.getAdminSettings(userId),
      undefined as Awaited<ReturnType<typeof storage.getAdminSettings>> | undefined,
    );
    const row = await safeDbRead(
      "admin_agent_mentor_state",
      () => storage.getAdminAgentMentorState(userId),
      undefined as Awaited<ReturnType<typeof storage.getAdminAgentMentorState>> | undefined,
    );
    const state = row ? parseStoredMentorState(row.state) : null;
    const mentorNudge = state?.pendingMentorNudges?.[0] ?? null;
    return NextResponse.json({
      greetingLine: buildPersonalizedGreetingLine(firstNameFromUser(user)),
      mentorNudge,
      policyNotice: ADMIN_AGENT_MENTOR_POLICY,
      mentorCompanion: {
        observeUsage: settings?.aiMentorObserveUsage ?? false,
        proactiveCheckpoints: settings?.aiMentorProactiveCheckpoints ?? true,
        actionsEnabled: settings?.aiAgentCanPerformActions ?? false,
      },
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
    const imgParsed = parseImageDataUrls(body.imageAttachments);
    if (!imgParsed.ok) {
      return NextResponse.json({ reply: imgParsed.error }, { status: 400 });
    }
    const hasMedia = imgParsed.dataUrls.length > 0;

    if (!message && !hasMedia) {
      return NextResponse.json({
        reply: `${buildPersonalizedGreetingLine(firstName)} Send a message or attach a screenshot to continue — try “open reminders”, “go to CRM”, or ask where a feature lives. I can read images when OpenAI is configured.`,
      });
    }

    const settings = await safeDbRead(
      "admin_settings",
      () => storage.getAdminSettings(userId),
      undefined as Awaited<ReturnType<typeof storage.getAdminSettings>> | undefined,
    );
    const canPerformActions = settings?.aiAgentCanPerformActions === true;
    const requireActionConfirmation = settings?.aiAgentRequireActionConfirmation !== false;
    const mentorObserveUsage = settings?.aiMentorObserveUsage === true;
    const mentorProactiveCheckpoints = settings?.aiMentorProactiveCheckpoints !== false;

    const mediaAug = hasMedia
      ? await augmentAdminAgentMessageWithMedia({
          message,
          imageDataUrls: imgParsed.dataUrls,
        })
      : null;
    const effectiveMessage = (mediaAug?.augmentedMessage ?? message).trim();
    if (!effectiveMessage) {
      return NextResponse.json({
        reply: "I could not understand that. Add a short text description or a clearer image.",
        mediaInterpretation: mediaAug?.mediaInterpretation,
      });
    }

    const [knowledgeRows, researchRows] = await Promise.all([
      safeDbRead("admin_agent_knowledge_entries(useInAgent)", () => storage.getAdminAgentKnowledgeForAgent(userId), []),
      safeDbRead(
        "admin_agent_knowledge_entries(useInResearch)",
        () => storage.getAdminAgentKnowledgeForResearch(userId),
        [],
      ),
    ]);
    const operatorKnowledgeBlock = formatKnowledgeForAgentPrompt(knowledgeRows);
    const operatorResearchBlock = formatResearchBlockForAgentPrompt(researchRows);

    const mentorRow = await safeDbRead(
      "admin_agent_mentor_state",
      () => storage.getAdminAgentMentorState(userId),
      undefined as Awaited<ReturnType<typeof storage.getAdminAgentMentorState>> | undefined,
    );
    const mentorParsed = mentorRow ? parseStoredMentorState(mentorRow.state) : null;
    const mentorState = mentorParsed ?? emptyMentorState();

    const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

    const result = await processAgentMessage({
      message: effectiveMessage,
      canPerformActions,
      currentPath,
      openaiAvailable: openaiConfigured,
      history,
      userId,
      operatorDisplayName: firstName,
      mentorState,
      mentorObserveUsage,
      mentorProactiveCheckpoints,
      operatorKnowledgeBlock,
      operatorResearchBlock,
    });

    if (openaiConfigured) {
      const mentorUserLine =
        message.trim() ||
        (mediaAug?.mediaInterpretation
          ? `[Image] ${mediaAug.mediaInterpretation.slice(0, 900)}`
          : effectiveMessage.slice(0, 900));
      persistMentorMerge(userId, mentorState, mentorUserLine, result.reply);
    }

    return NextResponse.json({
      ...result,
      mediaInterpretation: mediaAug?.mediaInterpretation,
      actionSummary: result.action ? describeAgentActionForUser(result.action) : undefined,
      requiresActionConfirmation: Boolean(result.action && requireActionConfirmation),
    });
  } catch (e) {
    console.error("POST admin agent error:", e);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
