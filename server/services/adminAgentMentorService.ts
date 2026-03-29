/**
 * Per-admin mentor memory + optional web grounding for the admin AI assistant.
 * State is stored only on this deployment to improve the agent — not for external sharing.
 * v2 adds coarse navigation stats when the admin opts in to usage observation (paths only).
 */

import "openai/shims/node";
import OpenAI from "openai";
import type {
  AdminAgentMentorStateV1,
  AdminAgentMentorStateV2,
  MentorRouteStat,
} from "@shared/schema";
import {
  braveWebSearch,
  type WebSearchHit,
} from "@server/services/crm/socialProfileDiscoveryService";

export const ADMIN_AGENT_MENTOR_POLICY =
  "Conversation-derived insights are stored only on this site to personalize your assistant; they are not sold or shared with third parties.";

/** Working mentor shape for prompts and merges (always v2 on disk after first save). */
export type AdminMentorWorkingState = AdminAgentMentorStateV2;

export function emptyMentorState(): AdminAgentMentorStateV2 {
  return {
    v: 2,
    habits: [],
    painPoints: [],
    goals: [],
    strengths: [],
    topicsOftenAsked: [],
    pendingMentorNudges: [],
  };
}

function strings(x: unknown): string[] {
  return Array.isArray(x)
    ? x.filter((i): i is string => typeof i === "string").map((s) => s.trim()).filter(Boolean)
    : [];
}

function parseRouteStats(raw: unknown): MentorRouteStat[] {
  if (!Array.isArray(raw)) return [];
  const out: MentorRouteStat[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const path = typeof o.path === "string" ? o.path : "";
    const visits = typeof o.visits === "number" && o.visits >= 0 ? Math.floor(o.visits) : 0;
    const lastVisitAt = typeof o.lastVisitAt === "string" ? o.lastVisitAt : "";
    if (!path.startsWith("/admin") || visits < 1) continue;
    out.push({ path: path.slice(0, 512), visits, lastVisitAt: lastVisitAt.slice(0, 64) });
  }
  return out.slice(0, 20);
}

function migrateV1ToV2(v: AdminAgentMentorStateV1): AdminAgentMentorStateV2 {
  return {
    v: 2,
    habits: v.habits,
    painPoints: v.painPoints,
    goals: v.goals,
    strengths: v.strengths,
    topicsOftenAsked: v.topicsOftenAsked,
    pendingMentorNudges: v.pendingMentorNudges,
  };
}

/**
 * Normalize DB JSON to v2 for prompts and persistence. Returns null only if completely invalid.
 */
export function parseStoredMentorState(raw: unknown): AdminAgentMentorStateV2 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const ver = o.v;
  if (ver === 2) {
    return {
      v: 2,
      habits: strings(o.habits),
      painPoints: strings(o.painPoints),
      goals: strings(o.goals),
      strengths: strings(o.strengths),
      topicsOftenAsked: strings(o.topicsOftenAsked),
      pendingMentorNudges: strings(o.pendingMentorNudges),
      topRoutes: parseRouteStats(o.topRoutes),
      lastCheckpointAt: typeof o.lastCheckpointAt === "string" ? o.lastCheckpointAt : undefined,
      workflowSignals: strings(o.workflowSignals),
    };
  }
  if (ver === 1) {
    const v1: AdminAgentMentorStateV1 = {
      v: 1,
      habits: strings(o.habits),
      painPoints: strings(o.painPoints),
      goals: strings(o.goals),
      strengths: strings(o.strengths),
      topicsOftenAsked: strings(o.topicsOftenAsked),
      pendingMentorNudges: strings(o.pendingMentorNudges),
    };
    return migrateV1ToV2(v1);
  }
  return null;
}

function capDedupe(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    const k = x.toLowerCase();
    if (!x || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length >= max) break;
  }
  return out;
}

export function mentorStateToPromptBlock(state: AdminAgentMentorStateV2 | null): string {
  if (!state) {
    return "No saved mentor profile yet — infer needs gently over time; do not invent personal facts.";
  }
  const lines: string[] = [];
  const add = (label: string, arr: string[]) => {
    if (arr.length === 0) return;
    lines.push(`${label}: ${arr.slice(0, 8).join("; ")}`);
  };
  add("Habits / patterns", state.habits);
  add("Pain points / struggles", state.painPoints);
  add("Goals", state.goals);
  add("Strengths", state.strengths);
  add("Topics they often ask about", state.topicsOftenAsked);
  add("Gentle nudges to consider", state.pendingMentorNudges);
  add("Workflow signals (coarse)", state.workflowSignals ?? []);

  const routes = state.topRoutes ?? [];
  if (routes.length > 0) {
    const summary = routes
      .slice(0, 8)
      .map((r) => `${r.path} (~${r.visits} visits, last ${r.lastVisitAt?.slice(0, 10) ?? "?"})`)
      .join("; ");
    lines.push(
      `Recent admin navigation (opt-in aggregate — paths only, no form data): ${summary}. Use this to infer workflows; do not state you are "watching" them unless they enabled observation in settings.`,
    );
  }

  return lines.length > 0 ? lines.join("\n") : "Profile is still sparse — invite them to share what they want to improve.";
}

/** Heuristic: attach live web snippets for teaching / general-knowledge questions, not for simple in-app navigation. */
export function shouldAttachWebSources(message: string): boolean {
  const t = message.trim();
  if (t.length < 14) return false;
  const lower = t.toLowerCase();
  const shortNav =
    t.length < 120 &&
    /\b(open|go to|navigate|where is|take me|show me|lead me)\b/i.test(lower) &&
    /\b(admin|crm|blog|dashboard|settings|newsletter|analytics|reminder|studio|directory|invoices|growth)\b/i.test(
      lower,
    );
  if (shortNav) return false;

  return /\b(what is|what are|why do|why does|how does|explain|learn about|best practice|documentation|official docs|according to|cite|research|compare|vs\.?\s|difference between|elaborate|deep dive|from the web|search (the )?web|look up|irs\.gov|ietf|mdn|w3c|oauth|gdpr|wcag|canonical|regulation|statute|standard specifies)\b/i.test(
    lower,
  );
}

export function formatWebHitsForPrompt(hits: WebSearchHit[]): string {
  if (hits.length === 0) return "";
  return hits
    .slice(0, 5)
    .map(
      (h, i) =>
        `${i + 1}. ${h.title}\n   URL: ${h.url}\n   ${h.description.slice(0, 320)}`,
    )
      .join("\n\n");
}

export async function fetchWebContextForTeaching(message: string): Promise<string> {
  if (!shouldAttachWebSources(message)) return "";
  const hits = await braveWebSearch(message.slice(0, 240), 6);
  const block = formatWebHitsForPrompt(hits);
  if (!block) return "";
  return `## Web results (use for factual teaching only; cite with [title](full_https_url) from this list)\n${block}`;
}

type MentorDelta = {
  addHabits?: string[];
  addPainPoints?: string[];
  addGoals?: string[];
  addStrengths?: string[];
  addTopics?: string[];
  replaceNudges?: string[] | null;
};

function applyMentorDelta(current: AdminAgentMentorStateV2, d: MentorDelta): AdminAgentMentorStateV2 {
  const merge = (base: string[], extra: string[] | undefined, max: number) =>
    capDedupe([...base, ...(extra ?? [])], max);
  return {
    ...current,
    v: 2,
    habits: merge(current.habits, d.addHabits, 8),
    painPoints: merge(current.painPoints, d.addPainPoints, 8),
    goals: merge(current.goals, d.addGoals, 8),
    strengths: merge(current.strengths, d.addStrengths, 8),
    topicsOftenAsked: merge(current.topicsOftenAsked, d.addTopics, 8),
    pendingMentorNudges:
      d.replaceNudges !== undefined && d.replaceNudges !== null
        ? capDedupe(d.replaceNudges, 4)
        : current.pendingMentorNudges,
  };
}

let openaiMerge: OpenAI | null = null;
function getMergeClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!openaiMerge) openaiMerge = new OpenAI({ apiKey: key });
  return openaiMerge;
}

function stripJsonFence(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return t;
}

export async function mergeMentorStateAfterExchange(
  current: AdminAgentMentorStateV2,
  userMessage: string,
  assistantReply: string,
): Promise<AdminAgentMentorStateV2> {
  const client = getMergeClient();
  if (!client) return current;

  const compactUser = userMessage.slice(0, 1800);
  const compactAsst = assistantReply.slice(0, 1800);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.15,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You update INTERNAL JSON deltas for one admin's AI mentor. This data stays on this server only; never include secrets, passwords, API keys, or private customer PII from the text.
Output ONLY valid JSON with optional keys:
{"addHabits":string[],"addPainPoints":string[],"addGoals":string[],"addStrengths":string[],"addTopics":string[],"replaceNudges":string[]|null}
Rules:
- Each add* array: 0-3 short factual phrases inferred from the USER message (not from generic assistant boilerplate).
- replaceNudges: optional 0-2 short friendly reminders for their next session (habits, follow-ups), or null to leave unchanged, or [] to clear.
- If nothing new, return {}.

The CURRENT_STATE may include read-only keys topRoutes, workflowSignals, lastCheckpointAt — ignore those; do not output them.`,
        },
        {
          role: "user",
          content: `CURRENT_STATE:\n${JSON.stringify(current)}\n\nUSER:\n${compactUser}\n\nASSISTANT:\n${compactAsst}`,
        },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(stripJsonFence(raw)) as MentorDelta;
    return applyMentorDelta(current, parsed);
  } catch (e) {
    console.warn("[adminAgentMentor] merge failed", e);
    return current;
  }
}

export function firstNameFromUser(user: {
  full_name?: string | null;
  username?: string | null;
}): string {
  const full = user.full_name?.trim();
  if (full) {
    const first = full.split(/\s+/)[0];
    if (first) return first;
  }
  const u = user.username?.trim();
  return u || "there";
}

export function buildPersonalizedGreetingLine(firstName: string): string {
  const hour = new Date().getHours();
  let part: string;
  if (hour < 12) part = "Good morning";
  else if (hour < 17) part = "Good afternoon";
  else part = "Good evening";
  return `${part}, ${firstName} — I'm your admin mentor and assistant.`;
}
