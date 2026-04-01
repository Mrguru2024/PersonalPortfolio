import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createExecutionRoleCustom, listExecutionRoles } from "@server/services/agencyOs/agencyOsService";
import { agencyOsExecutionRoleCreateSchema } from "@shared/agencyOsValidation";

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
  const roles = await listExecutionRoles();
  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  if (!user?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = agencyOsExecutionRoleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const role = await createExecutionRoleCustom(parsed.data);
    return NextResponse.json({ role });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
