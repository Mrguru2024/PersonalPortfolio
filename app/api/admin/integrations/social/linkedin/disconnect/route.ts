import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { disconnectContentStudioLinkedIn } from "@server/services/contentStudioLinkedInConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isSuperUser(request))) {
    return NextResponse.json({ message: "Sign in with the site owner account." }, { status: 403 });
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
  await disconnectContentStudioLinkedIn(accountId);
  return NextResponse.json({ ok: true });
}
