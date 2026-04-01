/**
 * Coarse admin usage signals (path visits) for the AI mentor — only when aiMentorObserveUsage is on.
 * No form values, keystrokes, or PII payloads.
 */

import type { AdminAgentMentorStateV2, MentorRouteStat } from "@shared/schema";

const MAX_ROUTES = 15;
const MAX_EVENTS_PER_REQUEST = 40;

export type AdminObservationEvent = {
  path: string;
  enteredAt: string;
  dwellMs?: number;
};

function capRoutes(routes: MentorRouteStat[]): MentorRouteStat[] {
  return [...routes].sort((a, b) => b.visits - a.visits || b.lastVisitAt.localeCompare(a.lastVisitAt)).slice(0, MAX_ROUTES);
}

function normalizePath(p: string): string | null {
  if (!p || typeof p !== "string") return null;
  const t = p.trim();
  if (!t.startsWith("/admin")) return null;
  if (t.length > 512) return t.slice(0, 512);
  return t;
}

/** Merge batched navigation events into mentor v2 state. */
export function mergeObservationIntoMentorState(
  state: AdminAgentMentorStateV2,
  events: AdminObservationEvent[],
): AdminAgentMentorStateV2 {
  const valid = events
    .filter((e) => e && typeof e.path === "string")
    .slice(0, MAX_EVENTS_PER_REQUEST);
  if (valid.length === 0) return state;

  const byPath = new Map<string, MentorRouteStat>();
  for (const r of state.topRoutes ?? []) {
    byPath.set(r.path, { ...r });
  }

  const recentPaths: string[] = [];
  for (const e of valid) {
    const path = normalizePath(e.path);
    if (!path) continue;
    const prev = byPath.get(path);
    const lastVisitAt =
      typeof e.enteredAt === "string" && e.enteredAt.length >= 8 ? e.enteredAt : new Date().toISOString();
    byPath.set(path, {
      path,
      visits: (prev?.visits ?? 0) + 1,
      lastVisitAt: lastVisitAt > (prev?.lastVisitAt ?? "") ? lastVisitAt : prev?.lastVisitAt ?? lastVisitAt,
    });
    recentPaths.push(path);
  }

  let workflowSignals = [...(state.workflowSignals ?? [])];
  const tail = recentPaths.slice(-4);
  if (tail.length >= 3 && tail.every((p) => p === tail[0])) {
    const sig = `rapid_revisit:${tail[0]}`;
    if (!workflowSignals.includes(sig)) {
      workflowSignals = [...workflowSignals, sig].slice(-8);
    }
  }

  return {
    ...state,
    v: 2,
    topRoutes: capRoutes([...byPath.values()]),
    workflowSignals,
  };
}

export function validateObservationPayload(raw: unknown): AdminObservationEvent[] | null {
  if (!raw || typeof raw !== "object") return null;
  const ev = (raw as { events?: unknown }).events;
  if (!Array.isArray(ev)) return null;
  const out: AdminObservationEvent[] = [];
  for (const x of ev) {
    if (!x || typeof x !== "object") continue;
    const path = (x as { path?: unknown }).path;
    const enteredAt = (x as { enteredAt?: unknown }).enteredAt;
    const dwellMs = (x as { dwellMs?: unknown }).dwellMs;
    if (typeof path !== "string" || typeof enteredAt !== "string") continue;
    const d =
      typeof dwellMs === "number" && Number.isFinite(dwellMs) ? Math.min(Math.max(0, Math.floor(dwellMs)), 86_400_000) : undefined;
    out.push({ path, enteredAt, dwellMs: d });
    if (out.length >= MAX_EVENTS_PER_REQUEST) break;
  }
  return out.length ? out : null;
}

const CHECKPOINT_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const CHECKPOINT_CHANCE = 0.11;

const CHECKPOINT_TEMPLATES: Array<(ctx: { topPath?: string }) => string> = [
  ({ topPath }) =>
    topPath
      ? `Quick checkpoint: you've been in **${topPath}** a lot lately — anything sticky there I can help untangle?`
      : `Quick checkpoint: what's the one Ascendra task you'd like to finish today?`,
  ({ topPath }) =>
    topPath
      ? `When you're ready: is **${topPath}** doing what you need, or should we adjust your workflow?`
      : `Mind a 10-second check-in — anything in Ascendra OS feeling slower than it should?`,
  () => `Gentle checkpoint: want me to open a specific admin screen or draft a reminder while you work?`,
];

/** Occasionally enqueue a short checkpoint nudge (non-blocking; shown in assistant header). */
export function maybeEnqueueCheckpointNudge(args: {
  state: AdminAgentMentorStateV2;
  proactiveCheckpoints: boolean;
  observeUsage: boolean;
  now?: Date;
}): { state: AdminAgentMentorStateV2; didUpdate: boolean } {
  const now = args.now ?? new Date();
  if (!args.proactiveCheckpoints) return { state: args.state, didUpdate: false };

  const last = args.state.lastCheckpointAt ? new Date(args.state.lastCheckpointAt).getTime() : 0;
  if (now.getTime() - last < CHECKPOINT_COOLDOWN_MS) return { state: args.state, didUpdate: false };
  if (Math.random() > CHECKPOINT_CHANCE) return { state: args.state, didUpdate: false };

  const top = (args.state.topRoutes ?? []).slice().sort((a, b) => b.visits - a.visits)[0];
  const topPath = top?.path;
  const hasSignals = (args.state.workflowSignals?.length ?? 0) > 0;
  if (!args.observeUsage && !hasSignals && (args.state.topRoutes?.length ?? 0) === 0) {
    const tpl = CHECKPOINT_TEMPLATES[2]!;
    const text = tpl({ topPath: undefined });
    const pending = capDedupeNudges([text, ...(args.state.pendingMentorNudges ?? [])], 4);
    return {
      state: { ...args.state, pendingMentorNudges: pending, lastCheckpointAt: now.toISOString() },
      didUpdate: true,
    };
  }

  const pick = CHECKPOINT_TEMPLATES[Math.floor(Math.random() * CHECKPOINT_TEMPLATES.length)]!;
  const text = pick({ topPath });
  const pending = capDedupeNudges([text, ...(args.state.pendingMentorNudges ?? [])], 4);
  return {
    state: { ...args.state, pendingMentorNudges: pending, lastCheckpointAt: now.toISOString() },
    didUpdate: true,
  };
}

function capDedupeNudges(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    const t = x.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
