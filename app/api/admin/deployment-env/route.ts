import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import {
  getVercelProjectRef,
  isVercelDeploymentEnvConfigured,
  listVercelProjectEnvVars,
  summarizeVercelEnvForAdmin,
  upsertVercelProjectEnvVar,
  type VercelEnvTarget,
} from "@server/services/vercelDeploymentEnvService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TARGETS = new Set<string>(["production", "preview", "development"]);

/**
 * GET — list Vercel project env keys (no secret values).
 * POST — upsert one variable on Vercel (production/preview/development targets).
 */
export async function GET(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Sign in with the site owner account." }, { status: 403 });
  }
  const projectRef = getVercelProjectRef();
  const configured = isVercelDeploymentEnvConfigured();
  if (!configured) {
    return NextResponse.json({
      configured: false,
      projectRef: projectRef ?? null,
      envs: [] as ReturnType<typeof summarizeVercelEnvForAdmin>[],
      message:
        "This page needs your Vercel sign-in key and which project to update, saved in the site’s settings. Your host or developer can add these; see the example settings file in the project.",
    });
  }

  const listed = await listVercelProjectEnvVars();
  if (!listed.ok) {
    return NextResponse.json({
      configured: true,
      projectRef,
      envs: [] as ReturnType<typeof summarizeVercelEnvForAdmin>[],
      listError: listed.error,
    });
  }


  return NextResponse.json({
    configured: true,
    projectRef,
    envs: listed.envs.map(summarizeVercelEnvForAdmin),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Sign in with the site owner account." }, { status: 403 });
  }

  let body: {
    key?: string;
    value?: string;
    type?: string;
    targets?: string[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key.trim() : "";
  const value = typeof body.value === "string" ? body.value : "";
  const typeRaw = typeof body.type === "string" ? body.type.trim().toLowerCase() : "sensitive";
  const type =
    typeRaw === "encrypted" || typeRaw === "plain" || typeRaw === "sensitive"
      ? typeRaw
      : ("sensitive" as const);

  const targets: VercelEnvTarget[] = [];
  if (Array.isArray(body.targets)) {
    for (const t of body.targets) {
      if (typeof t === "string" && TARGETS.has(t)) targets.push(t as VercelEnvTarget);
    }
  }
  if (targets.length === 0) {
    targets.push("production", "preview");
  }

  const done = await upsertVercelProjectEnvVar({ key, value, type, targets });
  if (!done.ok) {
    const st = done.status === 401 || done.status === 403 ? done.status : 400;
    return NextResponse.json({ message: done.error }, { status: st });
  }
  return NextResponse.json({ ok: true });
}
