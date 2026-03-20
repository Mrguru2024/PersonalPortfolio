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
  label?: string;
}

export interface AgentResult {
  reply: string;
  action?: AgentAction;
  suggestions?: string[];
}

interface DestinationIntent {
  label: string;
  url: string;
  keywords: string[];
  command: string;
  featureTag?: "new";
}

const NAVIGATION_VERBS = [
  "open",
  "go to",
  "navigate",
  "take me to",
  "jump to",
  "bring me to",
  "show",
  "visit",
];

const GENERATE_REMINDER_KEYWORDS = [
  "generate reminders",
  "run reminders",
  "refresh reminders",
  "create reminders",
  "run reminder engine",
];

const DESTINATION_INTENTS: DestinationIntent[] = [
  { label: "Dashboard", url: "/admin/dashboard", keywords: ["dashboard", "admin home", "home"], command: "open dashboard" },
  { label: "Reminders", url: "/admin/reminders", keywords: ["reminders", "reminder center", "admin reminders"], command: "open reminders" },
  { label: "CRM", url: "/admin/crm", keywords: ["crm", "contacts", "leads"], command: "open crm" },
  { label: "CRM dashboard", url: "/admin/crm/dashboard", keywords: ["crm dashboard", "crm overview"], command: "open crm dashboard" },
  { label: "CRM accounts", url: "/admin/crm/accounts", keywords: ["crm accounts", "accounts"], command: "open crm accounts" },
  { label: "CRM pipeline", url: "/admin/crm/pipeline", keywords: ["crm pipeline", "pipeline"], command: "open crm pipeline" },
  { label: "CRM tasks", url: "/admin/crm/tasks", keywords: ["crm tasks", "tasks"], command: "open crm tasks" },
  { label: "CRM personas", url: "/admin/crm/personas", keywords: ["crm personas", "personas"], command: "open crm personas" },
  { label: "CRM sequences", url: "/admin/crm/sequences", keywords: ["crm sequences", "sequences"], command: "open crm sequences", featureTag: "new" },
  { label: "CRM playbooks", url: "/admin/crm/playbooks", keywords: ["crm playbooks", "playbooks"], command: "open crm playbooks", featureTag: "new" },
  { label: "CRM saved lists", url: "/admin/crm/saved-lists", keywords: ["crm saved lists", "saved lists"], command: "open crm saved lists" },
  { label: "CRM discovery", url: "/admin/crm/discovery", keywords: ["crm discovery", "discovery"], command: "open crm discovery", featureTag: "new" },
  { label: "CRM import", url: "/admin/crm/import", keywords: ["crm import", "import contacts"], command: "open crm import" },
  { label: "Blog", url: "/admin/blog", keywords: ["blog", "posts"], command: "open blog" },
  { label: "Blog analytics", url: "/admin/blog/analytics", keywords: ["blog analytics", "post analytics"], command: "open blog analytics" },
  { label: "Website analytics", url: "/admin/analytics", keywords: ["website analytics", "analytics", "traffic"], command: "open analytics" },
  { label: "Invoices", url: "/admin/invoices", keywords: ["invoices", "invoice"], command: "open invoices" },
  { label: "Announcements", url: "/admin/announcements", keywords: ["announcements", "announcement"], command: "open announcements" },
  { label: "Admin chat", url: "/admin/chat", keywords: ["admin chat", "chat", "messages"], command: "open chat" },
  { label: "Feedback", url: "/admin/feedback", keywords: ["feedback"], command: "open feedback" },
  { label: "Newsletters", url: "/admin/newsletters", keywords: ["newsletters", "newsletter"], command: "open newsletters" },
  { label: "Newsletter subscribers", url: "/admin/newsletters/subscribers", keywords: ["newsletter subscribers", "subscribers"], command: "open newsletter subscribers" },
  { label: "Funnel", url: "/admin/funnel", keywords: ["funnel"], command: "open funnel" },
  { label: "Offers", url: "/admin/offers", keywords: ["offers"], command: "open offers" },
  { label: "Growth OS", url: "/admin/growth-os", keywords: ["growth os"], command: "open growth os", featureTag: "new" },
  { label: "Growth OS intelligence", url: "/admin/growth-os/intelligence", keywords: ["growth os intelligence", "intelligence"], command: "open growth os intelligence", featureTag: "new" },
  { label: "Growth OS security", url: "/admin/growth-os/security", keywords: ["growth os security", "security and audit"], command: "open growth os security", featureTag: "new" },
  { label: "Growth OS shares", url: "/admin/growth-os/shares", keywords: ["growth os shares", "client shares"], command: "open growth os shares", featureTag: "new" },
  { label: "Internal audit", url: "/admin/internal-audit", keywords: ["internal audit", "lead audit", "audit"], command: "open internal audit", featureTag: "new" },
  { label: "Content studio", url: "/admin/content-studio", keywords: ["content studio"], command: "open content studio", featureTag: "new" },
  { label: "Growth diagnosis", url: "/admin/growth-diagnosis", keywords: ["growth diagnosis", "diagnosis"], command: "open growth diagnosis" },
  { label: "Settings", url: "/admin/settings", keywords: ["settings", "preferences"], command: "open settings" },
  { label: "Integrations", url: "/admin/integrations", keywords: ["integrations", "integration"], command: "open integrations" },
  { label: "User management", url: "/admin/users", keywords: ["users", "user management"], command: "open users" },
  { label: "System monitor", url: "/admin/system", keywords: ["system monitor", "system"], command: "open system monitor" },
  { label: "Challenge leads", url: "/admin/challenge/leads", keywords: ["challenge leads", "challenge"], command: "open challenge leads" },
];

const QUESTION_STARTERS = ["what", "where", "how", "can", "should", "is", "are", "which", "why"];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestion(rawMessage: string, normalized: string): boolean {
  if (rawMessage.includes("?")) return true;
  return QUESTION_STARTERS.some((starter) => normalized.startsWith(`${starter} `) || normalized === starter);
}

function hasNavigationVerb(normalized: string): boolean {
  return NAVIGATION_VERBS.some((verb) => normalized.includes(verb));
}

function parseSlashCommand(normalized: string): string | undefined {
  if (!normalized.startsWith("/")) return undefined;
  const command = normalized.slice(1).trim();
  return command.length > 0 ? command : undefined;
}

function findDestination(query: string): DestinationIntent | undefined {
  let bestMatch: { intent: DestinationIntent; keywordLength: number } | null = null;
  for (const destination of DESTINATION_INTENTS) {
    for (const keyword of destination.keywords) {
      if (query.includes(keyword)) {
        if (!bestMatch || keyword.length > bestMatch.keywordLength) {
          bestMatch = { intent: destination, keywordLength: keyword.length };
        }
      }
    }
  }
  return bestMatch?.intent;
}

function parseNavigationAction(rawMessage: string): AgentAction | undefined {
  const normalized = normalizeText(rawMessage);
  const slash = parseSlashCommand(normalized);
  const searchText = slash ?? normalized;
  const reminderAction: AgentAction = {
    type: "generate_reminders",
    api: "POST /api/admin/reminders",
    label: "Generate reminders",
  };

  if (GENERATE_REMINDER_KEYWORDS.some((keyword) => searchText.includes(keyword))) {
    return reminderAction;
  }
  if (slash && (slash === "run reminders" || slash === "generate reminders")) {
    return reminderAction;
  }

  if (slash) {
    const slashNavPrefixes = ["open ", "go ", "goto ", "navigate ", "visit "];
    const prefix = slashNavPrefixes.find((candidate) => slash.startsWith(candidate));
    if (prefix) {
      const slashQuery = slash.slice(prefix.length).trim();
      const destination = findDestination(slashQuery);
      if (destination) {
        return { type: "navigate", url: destination.url, label: destination.label };
      }
    }
    return undefined;
  }

  const destination = findDestination(searchText);
  if (!destination) return undefined;

  // Keep a low-friction mode for short direct commands like "crm" or "dashboard".
  const isShortDirectCommand = destination.keywords.some(
    (keyword) => normalized === keyword || normalized === `open ${keyword}` || normalized === `go to ${keyword}`,
  );
  if (isShortDirectCommand || hasNavigationVerb(normalized)) {
    return { type: "navigate", url: destination.url, label: destination.label };
  }

  // If user typed only the destination-like phrase, execute directly.
  if (!isQuestion(rawMessage, normalized) && normalized.split(" ").length <= 4) {
    return { type: "navigate", url: destination.url, label: destination.label };
  }

  return undefined;
}

function routeToReadableName(path: string): string {
  const destination = DESTINATION_INTENTS.filter((intent) => path.startsWith(intent.url)).sort(
    (a, b) => b.url.length - a.url.length,
  )[0];
  return destination?.label ?? path;
}

const DEFAULT_SUGGESTIONS = [
  "Open dashboard",
  "Open CRM pipeline",
  "Open content studio",
  "Generate reminders",
  "What is new?",
];

function questionResponse(
  rawMessage: string,
  currentPath: string | undefined,
  canPerformActions: boolean,
): AgentResult | undefined {
  const normalized = normalizeText(rawMessage);
  const slash = parseSlashCommand(normalized);
  const compact = slash ?? normalized;
  const looksLikeQuestion = isQuestion(rawMessage, normalized);

  const asksForHelp =
    compact === "help" ||
    compact === "commands" ||
    compact === "?" ||
    compact.includes("what can you do") ||
    compact.includes("capabilities") ||
    compact.includes("list commands");

  if (asksForHelp) {
    return {
      reply:
        "I can open admin pages, run reminder generation, and answer quick navigation questions. Try natural language (e.g. 'open CRM pipeline') or slash commands like '/open growth os', '/run reminders', '/where am i', and '/new'.",
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  if (compact === "where am i" || compact === "where am i now" || compact === "whereami" || compact.includes("current page")) {
    if (currentPath) {
      return {
        reply: `You are currently on ${routeToReadableName(currentPath)} (${currentPath}).`,
        suggestions: ["Open dashboard", "Open settings", "Open CRM"],
      };
    }
    return {
      reply: "I cannot determine your current page yet. Ask me to open a page directly (for example: 'open dashboard').",
      suggestions: ["Open dashboard", "Open CRM", "Open reminders"],
    };
  }

  if (compact === "new" || compact === "whats new" || compact === "what s new" || compact.includes("new features")) {
    const newFeatureCommands = DESTINATION_INTENTS.filter((intent) => intent.featureTag === "new")
      .slice(0, 6)
      .map((intent) => intent.command);
    return {
      reply:
        "Newer admin areas I can route you to include Growth OS (overview/intelligence/security/shares), Internal Audit, Content Studio, plus CRM Discovery, Playbooks, and Sequences.",
      suggestions: newFeatureCommands.map((command) => command[0].toUpperCase() + command.slice(1)),
    };
  }

  if (compact.includes("actions enabled") || compact.includes("can you run actions") || compact.includes("action mode")) {
    return {
      reply: canPerformActions
        ? "Action mode is enabled. I can navigate and run reminder generation commands."
        : 'Action mode is disabled. Enable "Allow agent to perform actions" in Admin Settings so I can execute actions.',
      suggestions: canPerformActions ? ["Generate reminders", "Open reminders"] : ["Open settings", "What can you do?"],
    };
  }

  if (looksLikeQuestion) {
    return {
      reply:
        "I can answer navigation-focused admin questions and run commands. Ask me where features live, what is new, or tell me to open a specific admin section.",
      suggestions: ["Where am I?", "What is new?", "Open dashboard", "Open CRM"],
    };
  }

  return undefined;
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
  const question = questionResponse(message, currentPath, canPerformActions);
  if (question) {
    return question;
  }

  const action = parseNavigationAction(message);

  if (action && canPerformActions) {
    return {
      reply:
        action.type === "generate_reminders"
          ? "Running the reminder engine. New reminders will appear in the reminders list."
          : `Opening ${action.label ?? action.url ?? "that section"} now.`,
      action,
      suggestions:
        action.type === "generate_reminders"
          ? ["Open reminders", "Open dashboard", "What is new?"]
          : ["Generate reminders", "Open dashboard", "What is new?"],
    };
  }

  if (action && !canPerformActions) {
    return {
      reply: `I understood you want to open ${action.label ?? action.url ?? "that section"}, but performing actions is disabled in your Admin settings. Enable "Allow agent to perform actions" in Settings to let me run actions.`,
      suggestions: ["Open settings", "What can you do?", "What is new?"],
    };
  }

  const help =
    "I can help with admin actions, questions, and commands. Try: 'open content studio', 'open CRM pipeline', 'generate reminders', '/where am i', or '/help'.";
  return { reply: help, suggestions: DEFAULT_SUGGESTIONS };
}
