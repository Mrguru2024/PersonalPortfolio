/** Deterministic friendly aliases for anonymous behavior sessions (admin visitor hub). */

const ADJECTIVES = [
  "Swift",
  "Quiet",
  "Bright",
  "Bold",
  "Calm",
  "Quick",
  "Silver",
  "Golden",
  "Crimson",
  "Jade",
  "Amber",
  "Azure",
  "Coral",
  "Ivory",
  "Onyx",
  "Sunny",
  "Misty",
  "Cedar",
  "Willow",
  "Maple",
  "River",
  "Stone",
  "Frost",
  "Ember",
];

const NOUNS = [
  "Finch",
  "Heron",
  "Otter",
  "Lynx",
  "Panda",
  "Raven",
  "Falcon",
  "Coral",
  "Spruce",
  "Birch",
  "Sage",
  "Clover",
  "Harbor",
  "Summit",
  "Meadow",
  "Brook",
  "Glacier",
  "Canyon",
  "Pebble",
  "Cloud",
  "Nebula",
  "Comet",
  "Orbit",
  "Atlas",
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function visitorAliasFromSessionId(sessionId: string): string {
  const h = hashString(sessionId);
  const a = ADJECTIVES[h % ADJECTIVES.length];
  const n = NOUNS[(h >>> 8) % NOUNS.length];
  return `${a} ${n}`;
}

export function visitorSubtitleFromDevice(device: string | null | undefined): string {
  const d = (device ?? "").toLowerCase();
  if (d.includes("mobile")) return "Mobile visitor";
  if (d.includes("desktop")) return "Desktop visitor";
  return "Web visitor";
}

/** Known `businessId` values → short labels for admin UI (avoid raw keys when possible). */
const KNOWN_TRACKED_SITES: Record<string, string> = {
  ascendra_main: "Main marketing site",
};

/** Human-readable label for the tracked property / workspace key. */
export function trackedSiteLabel(businessId: string | null | undefined): string | null {
  if (!businessId?.trim()) return null;
  const k = businessId.trim();
  return KNOWN_TRACKED_SITES[k] ?? k.replace(/_/g, " ");
}

export function formatSessionDuration(start: Date, end: Date | null): string {
  const e = end ?? start;
  const sec = Math.max(0, Math.floor((e.getTime() - start.getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}
