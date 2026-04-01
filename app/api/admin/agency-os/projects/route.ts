import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createAgencyProjectFromValidated, listAgencyProjects } from "@server/services/agencyOs/agencyOsService";
import { agencyOsProjectCreateSchema } from "@shared/agencyOsValidation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  const projects = await listAgencyProjects();
  return NextResponse.json({ projects });
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
    const parsed = agencyOsProjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const uid = typeof user.id === "number" ? user.id : Number(user.id);
    const project = await createAgencyProjectFromValidated(parsed.data, Number.isFinite(uid) ? uid : null);
    return NextResponse.json({ project });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create project";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
