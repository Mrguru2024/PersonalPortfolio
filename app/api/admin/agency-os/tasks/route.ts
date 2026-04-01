import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createAgencyTaskFromValidated, listAgencyTasks } from "@server/services/agencyOs/agencyOsService";
import { agencyOsTaskCreateSchema } from "@shared/agencyOsValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const projectIdRaw = searchParams.get("projectId");
  const status = searchParams.get("status") ?? undefined;
  let projectId: number | undefined;
  if (projectIdRaw) {
    const n = Number.parseInt(projectIdRaw, 10);
    projectId = Number.isFinite(n) ? n : undefined;
  }
  const tasks = await listAgencyTasks({
    projectId,
    status: status || undefined,
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as unknown;
    const parsed = agencyOsTaskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const uid = typeof user.id === "number" ? user.id : Number(user.id);
    const task = await createAgencyTaskFromValidated(parsed.data, Number.isFinite(uid) ? uid : null);
    return NextResponse.json({ task });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create task";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
