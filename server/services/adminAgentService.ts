/**
 * Admin AI agent: intent parsing and allowed actions.
 * Reply can be from OpenAI (if configured) or static/keyword-based.
 * Actions are only returned when admin has aiAgentCanPerformActions.
 */

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
  | "generate_reminders";

export interface AgentAction {
  type: AgentActionType;
  url?: string;
  api?: string; // e.g. POST /api/admin/reminders
}

export interface AgentResult {
  reply: string;
  action?: AgentAction;
}

// Order matters: more specific phrases first (e.g. "generate reminders" before "reminders")
const NAV_INTENTS: { keywords: string[]; action: AgentAction }[] = [
  {
    keywords: ["generate reminders", "run reminders", "refresh reminders", "create reminders"],
    action: { type: "generate_reminders", api: "POST /api/admin/reminders" },
  },
  { keywords: ["reminders", "reminder"], action: { type: "open_reminders", url: "/admin/reminders" } },
  { keywords: ["crm", "contacts", "leads", "pipeline"], action: { type: "open_crm", url: "/admin/crm" } },
  { keywords: ["dashboard", "home"], action: { type: "open_dashboard", url: "/admin/dashboard" } },
  { keywords: ["settings", "preferences"], action: { type: "open_settings", url: "/admin/settings" } },
  { keywords: ["blog", "posts"], action: { type: "open_blog", url: "/admin/blog" } },
  { keywords: ["invoices", "invoice"], action: { type: "open_invoices", url: "/admin/invoices" } },
  { keywords: ["chat", "messages"], action: { type: "open_chat", url: "/admin/chat" } },
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

const FALLBACK_REPLIES: Record<string, string> = {
  reminders: "Opening reminders. You can view, dismiss, or generate new reminders there.",
  crm: "Opening CRM. You can manage contacts, pipeline, and tasks there.",
  dashboard: "Opening the dashboard.",
  settings: "Opening admin settings.",
  blog: "Opening the blog.",
  invoices: "Opening invoices.",
  chat: "Opening admin chat.",
  generate_reminders: "Running the reminder engine. New reminders will appear in the reminders list.",
};

function getReplyForAction(action: AgentAction): string {
  if (action.type === "navigate" && action.url) {
    return `Opening ${action.url}.`;
  }
  return FALLBACK_REPLIES[action.type] ?? `Done.`;
}

export interface ProcessAgentMessageInput {
  message: string;
  canPerformActions: boolean;
  currentPath?: string;
  openaiAvailable?: boolean;
}

/**
 * Process admin message and return reply + optional action.
 * If OpenAI is available we can use it for a friendlier reply; otherwise use keyword intent + static reply.
 */
export async function processAgentMessage(input: ProcessAgentMessageInput): Promise<AgentResult> {
  const { message, canPerformActions, currentPath } = input;
  const action = parseIntent(message);

  if (action && canPerformActions) {
    return {
      reply: getReplyForAction(action),
      action,
    };
  }

  if (action && !canPerformActions) {
    return {
      reply: `I understood you want to ${action.type.replace(/_/g, " ")}, but performing actions is disabled in your Admin settings. Enable "Allow agent to perform actions" in Settings to let me run actions.`,
    };
  }

  // No matching action: generic help
  const help =
    "I can help you navigate: try “open reminders”, “go to CRM”, “dashboard”, “settings”, or “generate reminders”. If you’ve enabled it in Settings, I can perform these actions for you.";
  return { reply: help };
}
