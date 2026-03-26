import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { disconnectContentStudioFacebook } from "@server/services/contentStudioFacebookConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isSuperUser(request))) {
    return NextResponse.json({ message: "Super user access required" }, { status: 403 });
  }
  await disconnectContentStudioFacebook();
  return NextResponse.json({ ok: true });
}
