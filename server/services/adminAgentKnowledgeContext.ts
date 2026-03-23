import type { AdminAgentKnowledgeEntryRow } from "@shared/schema";

/** Format DB rows for the admin agent system prompt (operator-owned facts). */
export function formatKnowledgeForAgentPrompt(entries: AdminAgentKnowledgeEntryRow[]): string {
  const rows = entries.filter((e) => e.useInAgent);
  if (rows.length === 0) {
    return "";
  }
  const blocks = rows.map(
    (e) =>
      `### ${e.title}\n${e.body.trim()}`.slice(0, 8000),
  );
  return (
    "\n\n## Operator knowledge base (trusted notes — use for tone, offers, and internal process; do not invent beyond this text)\n" +
    blocks.join("\n\n---\n\n").slice(0, 24_000)
  );
}

/** For research-style or diagnostic AI flows. */
export function formatKnowledgeForResearchPrompt(entries: AdminAgentKnowledgeEntryRow[]): string {
  const rows = entries.filter((e) => e.useInResearch);
  if (rows.length === 0) return "";
  return rows
    .map((e) => `### ${e.title}\n${e.body.trim()}`)
    .join("\n\n")
    .slice(0, 12_000);
}

/**
 * Injects research-flagged knowledge into the admin agent system prompt (separate from short “agent” notes).
 */
export function formatResearchBlockForAgentPrompt(entries: AdminAgentKnowledgeEntryRow[]): string {
  const core = formatKnowledgeForResearchPrompt(entries);
  if (!core.trim()) return "";
  return (
    "\n\n## Operator research notes (longer context for reasoning and suggestions; keep product spellings exact)\n" +
    core
  );
}

/** For outbound copy helpers (e.g. newsletter subject suggestions). */
export function formatKnowledgeForMessagesPrompt(entries: AdminAgentKnowledgeEntryRow[]): string {
  const rows = entries.filter((e) => e.useInMessages);
  if (rows.length === 0) return "";
  return (
    "\n\nOperator-approved reference (use facts and phrasing only when consistent with the topic):\n" +
    rows
      .map((e) => `- **${e.title}**: ${e.body.trim().replace(/\s+/g, " ")}`)
      .join("\n")
      .slice(0, 6000)
  );
}
