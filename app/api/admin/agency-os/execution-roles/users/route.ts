import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import {
  listApprovedAdminUsersMinimal,
  listUserExecutionRoleRows,
  setUserExecutionRoles,
} from "@server/services/agencyOs/agencyOsService";
import { agencyOsUserRolesSetSchema } from "@shared/agencyOsValidation";

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
  const userIdRaw = req.nextUrl.searchParams.get("userId");
  const admins = await listApprovedAdminUsersMinimal();
  if (!userIdRaw) {
    return NextResponse.json({ admins, roleIds: [] as number[] });
  }
  const userId = Number.parseInt(userIdRaw, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  const rows = await listUserExecutionRoleRows(userId);
  return NextResponse.json({
    admins,
    userId,
    roleIds: rows.map((r) => r.roleId),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const sessionUser = await getSessionUser(req);
  if (!sessionUser?.adminApproved) {
    return NextResponse.json({ message: "Approved admin required" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = agencyOsUserRolesSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const rows = await setUserExecutionRoles(parsed.data.userId, parsed.data.roleIds);
    return NextResponse.json({ assignments: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
