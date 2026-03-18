import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnProfileByUsername, getAfnProfileSettings } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/members/[username] — get public profile by username. Respects visibility. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }
    const currentUser = await getSessionUser(_req);
    const profile = await getAfnProfileByUsername(username);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const settings = await getAfnProfileSettings(profile.userId);
    const isOwnProfile = currentUser?.id && Number(currentUser.id) === profile.userId;
    if (!isOwnProfile && settings?.profileVisibility === "private") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const showContactLinks = isOwnProfile || settings?.showContactLinks !== false;
    return NextResponse.json({
      profile,
      settings: isOwnProfile ? settings : { showContactLinks, profileVisibility: settings?.profileVisibility },
    });
  } catch (e) {
    console.error("GET community member error:", e);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
