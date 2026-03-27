import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import {
  addFacebookConnectedPageFromPick,
  FB_CS_PAGE_PICK_COOKIE,
  parseFacebookPagePickCookie,
} from "@server/services/contentStudioFacebookConnectService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — Persists the selected Facebook Page and clears the pick cookie.
 */
export async function POST(req: NextRequest) {
  if (!(await isSuperUser(req))) {
    return NextResponse.json({ message: "Sign in with the site owner account." }, { status: 403 });
  }
  const raw = req.cookies.get(FB_CS_PAGE_PICK_COOKIE)?.value;
  if (!raw?.trim()) {
    return NextResponse.json({ message: "No pending Facebook Page selection." }, { status: 400 });
  }
  const candidates = parseFacebookPagePickCookie(raw);
  if (!candidates?.length) {
    const res = NextResponse.json({ message: "Pending session expired or invalid." }, { status: 400 });
    res.cookies.delete(FB_CS_PAGE_PICK_COOKIE);
    return res;
  }

  let body: { pageId?: string };
  try {
    body = (await req.json()) as { pageId?: string };
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId.trim() : "";
  if (!pageId) {
    return NextResponse.json({ message: "pageId is required" }, { status: 400 });
  }

  const saved = await addFacebookConnectedPageFromPick(pageId, candidates);
  if (!saved.ok) {
    return NextResponse.json({ message: saved.error }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(FB_CS_PAGE_PICK_COOKIE);
  return res;
}
