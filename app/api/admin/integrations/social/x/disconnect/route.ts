import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { disconnectContentStudioX } from "@server/services/contentStudioXConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
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
