import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { disconnectContentStudioX } from "@server/services/contentStudioXConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isSuperUser(request))) {
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  let accountId: string | undefined;
  try {
    const body = (await request.json().catch(() => null)) as { accountId?: unknown } | null;
    if (body && typeof body.accountId === "string" && body.accountId.trim()) {
      accountId = body.accountId.trim();
    }
  } catch {
    /* empty */
  }
  await disconnectContentStudioX(accountId);
  return NextResponse.json({ ok: true });
}
