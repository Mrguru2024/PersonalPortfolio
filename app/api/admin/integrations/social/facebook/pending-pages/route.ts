import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  FB_CS_PAGE_PICK_COOKIE,
  parseFacebookPagePickCookie,
} from "@server/services/contentStudioFacebookConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET — Lists Facebook Pages pending after OAuth (name/id only). Requires pick cookie from callback.
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
  }
  const raw = request.cookies.get(FB_CS_PAGE_PICK_COOKIE)?.value;
  if (!raw?.trim()) {
    return NextResponse.json({ message: "No pending Facebook Page selection." }, { status: 404 });
  }
  const pages = parseFacebookPagePickCookie(raw);
  if (!pages?.length) {
    return NextResponse.json({ message: "Pending session expired or invalid." }, { status: 404 });
  }
  return NextResponse.json({
    pages: pages.map((p) => ({ id: p.id, name: p.name })),
  });
}
