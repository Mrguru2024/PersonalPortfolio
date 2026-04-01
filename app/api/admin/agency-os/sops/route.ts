import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createSop, listSops } from "@server/services/agencyOs/agencyOsService";
import { agencyOsSopCreateSchema } from "@shared/agencyOsValidation";

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
  const sops = await listSops();
  return NextResponse.json({ sops });
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
  const parsed = agencyOsSopCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const uid = typeof user.id === "number" ? user.id : Number(user.id);
  try {
    const sop = await createSop(parsed.data, Number.isFinite(uid) ? uid : null);
    return NextResponse.json({ sop });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
