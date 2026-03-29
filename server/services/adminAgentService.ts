/**
 * Admin AI agent: codebase-aware context (cached), OpenAI when configured,
 * keyword intents, and site-directory search fallback.
 * Actions only when admin has aiAgentCanPerformActions.
 */

import "openai/shims/node";
import OpenAI from "openai";
import { stripConversationalSearchNoise } from "@/lib/advancedSearchQuery";
import { searchSiteDirectory, SITE_DIRECTORY_ENTRIES_UNIQUE } from "@/lib/siteDirectory";
import { getCachedAdminAgentContext } from "@server/services/adminAgentContextBuilder";
import type { AdminAgentMentorStateV1 } from "@shared/schema";
import {
  ADMIN_AGENT_MENTOR_POLICY,
  fetchWebContextForTeaching,
  mentorStateToPromptBlock,
  shouldAttachWebSources,
} from "@server/services/adminAgentMentorService";
import { getAdminAgentOpenAiModel } from "@server/services/growthIntelligence/growthIntelligenceConfig";

export type AgentActionType =
  | "navigate"
  | "open_reminders"
  | "open_crm"
  | "open_dashboard"
  | "open_settings"
  | "open_contacts"
  | "open_blog"
  | "open_invoices"
  | "open_chat"
  | "generate_reminders"
  | "open_scheduler"
  | "open_scheduler_calendar"
  | "open_scheduler_workflows";

export interface AgentAction {
  type: AgentActionType;
  url?: string;
  api?: string;
}

export interface AgentResult {
  reply: string;
  action?: AgentAction;
}

export interface AgentChatTurn {
  role: "user" | "assistant";
  content: string;
}

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

/** URL must match a known route from siteDirectory (static or dynamic segment). */
export function isKnownSitePath(pathname: string): boolean {
  const p = pathname.split("?")[0].split("#")[0].trim();
  if (!p.startsWith("/") || p.includes("..") || p.includes("//")) return false;
  if (p.includes("[") || p.includes("]")) return false;
  for (const e of SITE_DIRECTORY_ENTRIES_UNIQUE) {
    if (e.path === p) return true;
    const bracket = e.path.indexOf("[");
    if (bracket > 0) {
      const prefix = e.path.slice(0, bracket);
      if (p.startsWith(prefix) && p.length >= prefix.length) return true;
    }
  }
  return false;
}

/** Paths for model-returned `open_*` actions (AdminAgentWidget navigates via `action.url`). */
const OPEN_ACTION_URLS: Partial<Record<AgentActionType, string>> = {
  open_reminders: "/admin/reminders",
  open_crm: "/admin/crm",
  open_dashboard: "/admin/dashboard",
  open_settings: "/admin/settings",
  open_contacts: "/admin/crm",
  open_blog: "/admin/blog",
  open_invoices: "/admin/invoices",
  open_chat: "/admin/chat",
};

function normalizeModelAction(
  raw: unknown,
  canPerformActions: boolean
): AgentAction | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const type = o.type;
  if (type === "generate_reminders") {
    if (!canPerformActions) return undefined;
    return { type: "generate_reminders", api: "POST /api/admin/reminders" };
  }
  if (type === "navigate" && typeof o.url === "string") {
    if (!canPerformActions) return undefined;
    const url = o.url.trim();
    if (!isKnownSitePath(url)) return undefined;
    return { type: "navigate", url };
  }
  if (typeof type === "string" && type in OPEN_ACTION_URLS && OPEN_ACTION_URLS[type as AgentActionType]) {
    if (!canPerformActions) return undefined;
    const url = OPEN_ACTION_URLS[type as AgentActionType]!;
    return { type: type as AgentActionType, url };
  }
  return undefined;
}

// Order matters: more specific phrases first
const NAV_INTENTS: { keywords: string[]; action: AgentAction }[] = [
  {
    keywords: ["generate reminders", "run reminders", "refresh reminders", "create reminders"],
    action: { type: "generate_reminders", api: "POST /api/admin/reminders" },
  },
  { keywords: ["site directory", "page directory", "sitemap", "find a page", "search pages"], action: { type: "navigate", url: "/admin/site-directory" } },
  { keywords: ["content studio", "content calendar", "scheduled posts"], action: { type: "navigate", url: "/admin/content-studio" } },
  { keywords: ["newsletter", "newsletters", "subscribers"], action: { type: "navigate", url: "/admin/newsletters" } },
  {
    keywords: ["ascendra intelligence", "persona iq", "marketing personas", "lead magnets", "outreach scripts"],
    action: { type: "navigate", url: "/admin/ascendra-intelligence" },
  },
  { keywords: ["lead intake", "inbound leads"], action: { type: "navigate", url: "/admin/lead-intake" } },
  { keywords: ["growth os", "gos hub", "gos dashboard"], action: { type: "navigate", url: "/admin/growth-os" } },
  {
    keywords: ["amie", "market intelligence engine", "decision intelligence", "ascendra market intelligence"],
    action: { type: "navigate", url: "/admin/market-intelligence" },
  },
  {
    keywords: ["growth os intelligence", "gos intelligence", "topic discovery", "intelligence tab growth os"],
    action: { type: "navigate", url: "/admin/growth-os/intelligence" },
  },
  { keywords: ["assistant knowledge", "agent knowledge", "knowledge base assistant"], action: { type: "navigate", url: "/admin/agent-knowledge" } },
  { keywords: ["internal audit", "funnel audit"], action: { type: "navigate", url: "/admin/internal-audit" } },
  { keywords: ["growth diagnosis", "diagnosis admin", "diagnosis submissions"], action: { type: "navigate", url: "/admin/growth-diagnosis" } },
  { keywords: ["funnel admin", "funnel pages", "growth kit admin"], action: { type: "navigate", url: "/admin/funnel" } },
  { keywords: ["site offers", "edit offer page"], action: { type: "navigate", url: "/admin/offers" } },
  { keywords: ["analytics", "traffic", "website stats"], action: { type: "navigate", url: "/admin/analytics" } },
  { keywords: ["announcements", "project updates"], action: { type: "navigate", url: "/admin/announcements" } },
  { keywords: ["feedback inbox", "user feedback"], action: { type: "navigate", url: "/admin/feedback" } },
  { keywords: ["user management", "approve users", "admin users"], action: { type: "navigate", url: "/admin/users" } },
  { keywords: ["system monitor", "health logs"], action: { type: "navigate", url: "/admin/system" } },
  { keywords: ["integrations"], action: { type: "navigate", url: "/admin/integrations" } },
  { keywords: ["operator profile"], action: { type: "navigate", url: "/admin/operator-profile" } },
  { keywords: ["challenge leads"], action: { type: "navigate", url: "/admin/challenge/leads" } },
  { keywords: ["crm pipeline", "deal pipeline"], action: { type: "navigate", url: "/admin/crm/pipeline" } },
  { keywords: ["crm tasks"], action: { type: "navigate", url: "/admin/crm/tasks" } },
  { keywords: ["crm import", "import leads"], action: { type: "navigate", url: "/admin/crm/import" } },
  { keywords: ["email sequences", "sequences"], action: { type: "navigate", url: "/admin/crm/sequences" } },
  { keywords: ["discovery inbox"], action: { type: "navigate", url: "/admin/crm/discovery" } },
  {
    keywords: ["discovery toolkit", "zoom prep", "discovery tools hub"],
    action: { type: "navigate", url: "/admin/crm/discovery-tools" },
  },
  { keywords: ["ltv report", "client ltv", "revenue report admin"], action: { type: "navigate", url: "/admin/crm/ltv" } },
  { keywords: ["playbooks"], action: { type: "navigate", url: "/admin/crm/playbooks" } },
  { keywords: ["proposal prep"], action: { type: "navigate", url: "/admin/crm/proposal-prep" } },
  { keywords: ["reminders", "reminder"], action: { type: "open_reminders", url: "/admin/reminders" } },
  { keywords: ["crm", "contacts", "leads"], action: { type: "open_crm", url: "/admin/crm" } },
  {
    keywords: [
      "scheduler workflows",
      "booking automations",
      "meeting automations",
      "scheduler automation",
    ],
    action: { type: "open_scheduler_workflows", url: "/admin/scheduler/workflows" },
  },
  {
    keywords: ["scheduler calendar", "meetings calendar", "booking calendar", "master calendar"],
    action: { type: "open_scheduler_calendar", url: "/admin/scheduler/calendar" },
  },
  {
    keywords: [
      "scheduler",
      "scheduling",
      "bookings and calendar",
      "meetings & calendar",
      "booking pages",
      "meeting types",
    ],
    action: { type: "open_scheduler", url: "/admin/scheduler" },
  },
  { keywords: ["dashboard", "admin home"], action: { type: "open_dashboard", url: "/admin/dashboard" } },
  { keywords: ["settings", "preferences"], action: { type: "open_settings", url: "/admin/settings" } },
  { keywords: ["blog", "posts", "cms"], action: { type: "open_blog", url: "/admin/blog" } },
  { keywords: ["invoices", "invoice"], action: { type: "open_invoices", url: "/admin/invoices" } },
  { keywords: ["admin chat", "support chat"], action: { type: "open_chat", url: "/admin/chat" } },
];

function parseIntent(message: string): AgentAction | undefined {
  const lower = message.toLowerCase().trim();
  for (const { keywords, action } of NAV_INTENTS) {
    if (keywords.some((k) => lower.includes(k))) return action;
  }
  if (lower.includes("go to ") || lower.includes("open ") || lower.includes("navigate")) {
    for (const { keywords, action } of NAV_INTENTS) {
      if (keywords.some((k) => lower.includes(k))) return action;
    }
  }
  return undefined;
}

/**
 * If search matches exactly one admin screen (no dynamic pattern in path), suggest navigation.
 */
function singleAdminDirectoryMatch(message: string): AgentAction | undefined {
  const cleaned = stripConversationalSearchNoise(message);
  const q = cleaned.length >= 2 ? cleaned : message.trim();
  const matches = searchSiteDirectory(q);
  const adminStatic = matches.filter((m) => m.audience === "admin" && !m.path.includes("["));
  if (adminStatic.length !== 1) return undefined;
  return { type: "navigate", url: adminStatic[0].path };
}

function titleForPath(path: string): string {
  const e = SITE_DIRECTORY_ENTRIES_UNIQUE.find((x) => x.path === path);
  if (e) return e.title;
  const seg = path.split("/").filter(Boolean).pop() ?? path;
  return seg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Human-readable confirmation line for the admin UI (spellings match in-app labels). */
export function describeAgentActionForUser(action: AgentAction): string {
  if (action.type === "generate_reminders") {
    return "Run the reminder generator and refresh your admin reminders list.";
  }
  if (action.url) {
    const label = titleForPath(action.url);
    return `Navigate to **${label}** (${action.url}).`;
  }
  return "Perform an in-app action.";
}

/** Markdown link for assistant replies (rendered as clickable in the admin widget). */
function mdLink(path: string, label?: string): string {
  const t = label ?? titleForPath(path);
  return `[${t}](${path})`;
}

/** Ranked site-directory hits for fallback replies (same search as /admin/site-directory). */
function formatDirectorySuggestionBlock(message: string): string {
  const cleaned = stripConversationalSearchNoise(message);
  const q = cleaned.length >= 2 ? cleaned : message.trim();
  if (q.length < 2) return "";
  const hits = searchSiteDirectory(q).slice(0, 5);
  if (hits.length === 0) return "";
  const lines = hits.map((e) => `- ${mdLink(e.path, e.title)} — ${e.category}`);
  return `\n\n**Closest pages in the directory:**\n${lines.join("\n")}`;
}

function getReplyForAction(action: AgentAction): string {
  if (action.type === "generate_reminders") {
    return `Started the reminder run. Open ${mdLink("/admin/reminders")} to review new tasks.\n\nIf nothing shows yet, refresh the list in a moment.`;
  }
  if (action.url) {
    const label = titleForPath(action.url);
    return `**${label}** — ${mdLink(action.url, `Open ${label}`)}.\n\nTaking you there now.`;
  }
  return "Done.";
}

function stripJsonFence(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return t;
}

/** Parse agent JSON reply; tolerate extra prose or fenced blocks from the model. */
function parseAgentModelJson(raw: string): { reply?: string; action?: unknown } | null {
  const cleaned = stripJsonFence(raw);
  try {
    return JSON.parse(cleaned) as { reply?: string; action?: unknown };
  } catch {
    try {
      const t = cleaned.trim();
      const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
      const body = fenced ? fenced[1]!.trim() : t;
      const start = body.indexOf("{");
      const end = body.lastIndexOf("}");
      if (start === -1 || end <= start) return null;
      return JSON.parse(body.slice(start, end + 1)) as { reply?: string; action?: unknown };
    } catch {
      return null;
    }
  }
}

async function processWithOpenAI(input: {
  message: string;
  history: AgentChatTurn[];
  contextText: string;
  canPerformActions: boolean;
  currentPath?: string;
  operatorDisplayName: string;
  mentorPromptBlock: string;
  webContextBlock: string;
  /** Operator-authored notes injected from the knowledge base (when enabled per entry). */
  operatorKnowledgeBlock: string;
  /** Longer-form notes for research-style grounding (when enabled per entry). */
  operatorResearchBlock: string;
}): Promise<AgentResult | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const actionRules = input.canPerformActions
    ? `You may set "action" to run something in the app (exact JSON shapes only):
- {"type":"navigate","url":"<path>"} — use only if <path> is listed in CONTEXT as a real route (no "[" or "]" in the string). Prefer hub paths such as /admin/crm, /admin/blog, /admin/content-studio, /admin/ascendra-intelligence, /admin/growth-os, /admin/market-intelligence, /admin/agent-knowledge.
- Alternatively you may use these exact types (no url needed): "open_reminders", "open_crm", "open_dashboard", "open_settings", "open_blog", "open_invoices", "open_chat", "open_contacts" (same as CRM), "open_scheduler", "open_scheduler_calendar", "open_scheduler_workflows" (Meetings & calendar hub, master calendar, booking automations).
- {"type":"generate_reminders","api":"POST /api/admin/reminders"} when they ask to generate, run, or refresh reminders.
Otherwise set "action": null. Never invent types or URLs.

Spelling and labels: use correct product names — Ascendra, Ascendra Intelligence, Growth OS, Content Studio, Brand Growth. Match directory titles for screen names.`
    : `Do not return an action. Always set "action": null (actions are disabled for this user).`;

  const webSection =
    input.webContextBlock.trim().length > 0
      ? `\n\n${input.webContextBlock}\n\nWhen you teach general concepts or external facts, ground claims in the web results above and cite as [publisher or title](full_https_url) using only URLs from that list. If web results are empty or irrelevant, say you could not verify live sources and stick to CONTEXT + general process guidance.`
      : "\n\nNo live web results were attached for this turn. For external facts, say when you are unsure and suggest authoritative sources they can check; do not invent citations.";

  const system = `You are the Ascendra admin assistant and mentor for approved CMS/CRM operators. You address the operator by name when natural: ${input.operatorDisplayName}.

Mission: solve their problem and help them grow — teach, guide, and (when helpful) remind them of habits that keep the business healthy (e.g. reviewing ${mdLink("/admin/reminders", "Reminders")}, checking ${mdLink("/admin/crm", "CRM")} follow-ups, keeping content and analytics on a rhythm). Balance product wayfinding with coaching: if they sound stuck or overwhelmed, acknowledge it and offer a small next step.

Operator memory (INTERNAL — ${ADMIN_AGENT_MENTOR_POLICY}):
${input.mentorPromptBlock}

Mission detail: give clear next steps, name the exact screen or API from CONTEXT when the task is in-app, and when they need to do something in the UI, tell them what to click or run. If they ask how to fix an issue, propose a concrete workflow (which admin area first, then what). If they want a command or automation, point to the matching npm script or /api/admin/... route from CONTEXT when relevant. Prefer actionable outcomes over generic chat.

Grounding for THIS SITE: use only facts from CONTEXT (site routes, admin API paths, npm scripts, AGENTS.md, FEATURE GUIDE) for navigation, APIs, and product behavior. The CONTEXT refreshes every few minutes from this deployment. If something is missing, say so and point them to ${mdLink("/admin/site-directory", "Site directory")} to search.
${webSection}

Navigation and wayfinding: whenever you mention an in-app place to go, include a markdown link using ONLY internal paths from CONTEXT, like [Analytics](/admin/analytics) or [Content Studio](/admin/content-studio). Use short, human labels. For multiple options, list 2–4 links with one sentence each so they can click the right destination. External https links are allowed only when citing WEB RESULTS for teaching.

Accuracy: spell product and screen names exactly as in CONTEXT or OPERATOR KNOWLEDGE (e.g. Ascendra Intelligence, Growth OS). When quoting UI text or OCR from the user, preserve spelling; fix only clear typos if you label them as corrections.

Style: concise. Format the "reply" for quick scanning in a small chat panel:
- Open with one short sentence when it helps (the takeaway).
- Use ## for section titles (e.g. ## Next steps, ## Where to go). Add a blank line before each ## block.
- Use bullet lines starting with "- " for steps or options (one item per line). For ordered steps use "1. " "2. " on separate lines.
- Use backticks for literals: npm scripts, file paths, and API paths (e.g. \`npm run check\`, \`/api/admin/crm\`).
- Use **bold** sparingly for critical terms. Keep markdown links [Label](/path) for every admin route you mention.
- The "reply" value is JSON — escape quotes and newlines properly inside the string.

${actionRules}

Output a single JSON object only (valid JSON). The value of "reply" may contain markdown links and **bold** as described:
{"reply":"string","action":null|object}

Current page (if any): ${input.currentPath ?? "unknown"}
${input.operatorKnowledgeBlock}
${input.operatorResearchBlock}

CONTEXT:
${input.contextText}`;

  const hist = input.history.slice(-12).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 4000),
  }));

  const model = getAdminAgentOpenAiModel();
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 1100,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system.slice(0, 100_000) },
        ...hist.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: input.message.slice(0, 4000) },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "";
    const parsed = parseAgentModelJson(raw);
    if (!parsed) {
      console.warn("[admin agent] model output was not valid JSON object");
      return null;
    }
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim().slice(0, 8000) : "";
    if (!reply) return null;
    const action = normalizeModelAction(parsed.action, input.canPerformActions);
    return { reply, action };
  } catch (e: unknown) {
    if (e instanceof OpenAI.APIError && (e.status === 403 || e.code === "model_not_found")) {
      console.error(
        `[admin agent] OpenAI rejected model "${model}" (403 / model_not_found). Set OPENAI_ADMIN_AGENT_MODEL to an allowed model for this API key.`,
        e.message,
      );
    } else {
      console.error("admin agent OpenAI error:", e);
    }
    return null;
  }
}

export interface ProcessAgentMessageInput {
  message: string;
  canPerformActions: boolean;
  currentPath?: string;
  openaiAvailable?: boolean;
  history?: AgentChatTurn[];
  /** Numeric user id for logging / future use */
  userId?: number;
  operatorDisplayName?: string;
  mentorState?: AdminAgentMentorStateV1 | null;
  /** Pre-formatted operator knowledge (from DB); empty string if none. */
  operatorKnowledgeBlock?: string;
  /** Research-oriented notes (from DB); empty string if none. */
  operatorResearchBlock?: string;
}

/**
 * Process admin message and return reply + optional action.
 */
export async function processAgentMessage(input: ProcessAgentMessageInput): Promise<AgentResult> {
  const { message, canPerformActions, currentPath } = input;
  const history = Array.isArray(input.history)
    ? input.history.filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    : [];

  const cached = await getCachedAdminAgentContext();

  // Deterministic: reminder job always wins on keyword match
  const reminderIntent = NAV_INTENTS.find((n) => n.action.type === "generate_reminders");
  if (reminderIntent && canPerformActions) {
    const lower = message.toLowerCase().trim();
    if (reminderIntent.keywords.some((k) => lower.includes(k))) {
      return { reply: getReplyForAction(reminderIntent.action), action: reminderIntent.action };
    }
  }

  const useOpenAI = input.openaiAvailable !== false && getOpenAIClient() !== null;
  if (useOpenAI) {
    const operatorDisplayName = input.operatorDisplayName?.trim() || "there";
    const mentorPromptBlock = mentorStateToPromptBlock(input.mentorState ?? null);
    let webContextBlock = "";
    if (shouldAttachWebSources(message)) {
      webContextBlock = await fetchWebContextForTeaching(message);
    }
    const ai = await processWithOpenAI({
      message,
      history,
      contextText: cached.text,
      canPerformActions,
      currentPath,
      operatorDisplayName,
      mentorPromptBlock,
      webContextBlock,
      operatorKnowledgeBlock: (input.operatorKnowledgeBlock ?? "").trim(),
      operatorResearchBlock: (input.operatorResearchBlock ?? "").trim(),
    });
    if (ai) {
      if (ai.action && !canPerformActions) {
        return { reply: ai.reply };
      }
      return ai;
    }
  }

  const keywordAction = parseIntent(message);
  const directoryAction = !keywordAction ? singleAdminDirectoryMatch(message) : undefined;
  const action = keywordAction ?? directoryAction;

  if (action && canPerformActions) {
    return {
      reply: getReplyForAction(action),
      action,
    };
  }

  if (action && !canPerformActions) {
    if (action.type === "generate_reminders") {
      return {
        reply: `I can run the reminder job when **Allow agent to perform actions** is on — toggle it in ${mdLink("/admin/settings", "Admin settings")}.\n\nYou can still open ${mdLink("/admin/reminders", "Reminders")} and manage tasks there.`,
      };
    }
    const path = action.url ?? "/admin/site-directory";
    const link = mdLink(path, titleForPath(path));
    return {
      reply: `I matched **${action.type === "navigate" ? titleForPath(path) : action.type.replace(/_/g, " ")}** (${link}), but **Allow agent to perform actions** is off.\n\nEnable it in ${mdLink("/admin/settings", "Admin settings")}, or use the link above.`,
    };
  }

  const hint = `Browse the ${mdLink("/admin/site-directory", "site directory")} to search every route — use **quotes** for exact phrases (e.g. \`"lead intake"\` \`crm\`). Common hubs: ${mdLink("/admin/content-studio", "Content Studio")}, ${mdLink("/admin/crm", "CRM")}, ${mdLink("/admin/analytics", "Analytics")}, ${mdLink("/admin/ascendra-intelligence", "Ascendra Intelligence")}, ${mdLink("/admin/growth-os", "Growth OS")}. Say **generate reminders** to refresh admin reminders (if actions are enabled).`;
  const ranked = formatDirectorySuggestionBlock(message);
  return {
    reply: `I’m not sure which screen you mean.\n\n${hint}\n\nDescribe the problem you’re solving (e.g. “publish a newsletter”, “find lead intake”) and I’ll narrow it down.${ranked}`,
  };
}
