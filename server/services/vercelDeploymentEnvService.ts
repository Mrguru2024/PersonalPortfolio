/**
 * Push environment variables to Vercel via REST API (optional admin feature).
 * Requires server-only VERCEL_API_TOKEN (or VERCEL_TOKEN) + project ref + optional VERCEL_TEAM_ID.
 */

const VERCEL_API = "https://api.vercel.com";

export type VercelEnvTarget = "production" | "preview" | "development";

export type VercelEnvRow = {
  id: string;
  key: string;
  type: string;
  /** Targets may be string or string[] in API responses */
  target: VercelEnvTarget[] | string;
};

function getToken(): string | null {
  const t = process.env.VERCEL_API_TOKEN?.trim() || process.env.VERCEL_TOKEN?.trim();
  return t || null;
}

/** Project ID (prj_…) or project name slug from Vercel dashboard. */
export function getVercelProjectRef(): string | null {
  const id = process.env.VERCEL_PROJECT_ID?.trim();
  const name = process.env.VERCEL_PROJECT_NAME?.trim();
  return id || name || null;
}

function getTeamId(): string | null {
  return process.env.VERCEL_TEAM_ID?.trim() || null;
}

export function isVercelDeploymentEnvConfigured(): boolean {
  return !!(getToken() && getVercelProjectRef());
}

function teamQuerySuffix(extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(extra);
  const team = getTeamId();
  if (team) params.set("teamId", team);
  const s = params.toString();
  return s ? `?${s}` : "";
}

function normalizeTargets(target: VercelEnvRow["target"]): VercelEnvTarget[] {
  if (Array.isArray(target)) return target;
  if (typeof target === "string") return [target as VercelEnvTarget];
  return [];
}

export async function listVercelProjectEnvVars(): Promise<
  { ok: true; envs: VercelEnvRow[] } | { ok: false; error: string; status?: number }
> {
  const token = getToken();
  const project = getVercelProjectRef();
  if (!token || !project) {
    return {
      ok: false,
      error:
        "Missing VERCEL_API_TOKEN (or VERCEL_TOKEN) and VERCEL_PROJECT_ID or VERCEL_PROJECT_NAME on the server.",
    };
  }

  const path = `${VERCEL_API}/v10/projects/${encodeURIComponent(project)}/env${teamQuerySuffix()}`;
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    envs?: unknown;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    return { ok: false, error: msg || `HTTP ${res.status}`, status: res.status };
  }

  const raw = Array.isArray(data.envs) ? data.envs : [];
  const envs: VercelEnvRow[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const key = typeof o.key === "string" ? o.key : "";
    const type = typeof o.type === "string" ? o.type : "";
    const target = o.target as VercelEnvRow["target"];
    if (id && key) envs.push({ id, key, type, target });
  }
  return { ok: true, envs };
}

export type UpsertVercelEnvInput = {
  key: string;
  value: string;
  type: "sensitive" | "encrypted" | "plain";
  targets: VercelEnvTarget[];
};

export async function upsertVercelProjectEnvVar(
  input: UpsertVercelEnvInput,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const token = getToken();
  const project = getVercelProjectRef();
  if (!token || !project) {
    return {
      ok: false,
      error:
        "Missing VERCEL_API_TOKEN (or VERCEL_TOKEN) and VERCEL_PROJECT_ID or VERCEL_PROJECT_NAME on the server.",
    };
  }

  const key = input.key.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return { ok: false, error: "Invalid key: use letters, numbers, underscores (typical ENV_KEY shape)." };
  }
  if (!input.value.length) {
    return { ok: false, error: "Value is required." };
  }
  if (!input.targets.length) {
    return { ok: false, error: "Select at least one deployment target." };
  }

  const path = `${VERCEL_API}/v10/projects/${encodeURIComponent(project)}/env${teamQuerySuffix({
    upsert: "true",
  })}`;

  const res = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value: input.value,
      type: input.type,
      target: input.targets,
      comment: "Set from Ascendra admin → Deployment env",
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    return { ok: false, error: msg || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true };
}

/** For API responses — safe summaries (no values). */
export function summarizeVercelEnvForAdmin(row: VercelEnvRow) {
  return {
    id: row.id,
    key: row.key,
    type: row.type,
    targets: normalizeTargets(row.target),
  };
}
