import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  getAfnProfileSettings,
  upsertAfnProfileSettings,
} from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/profile/settings — get current user's AFN profile settings. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getAfnProfileSettings(Number(user.id));
    if (!settings) {
      return NextResponse.json({
        settings: {
          profileVisibility: "public",
          messagePermission: "none",
          openToCollaborate: false,
          showActivity: true,
          showContactLinks: true,
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
        },
      });
    }
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("GET community profile settings error:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

/** PATCH /api/community/profile/settings — update settings. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(user.id);
    const body = await req.json().catch(() => ({}));
    const settings = await upsertAfnProfileSettings({
      userId,
      profileVisibility: body.profileVisibility ?? "public",
      messagePermission: body.messagePermission ?? "none",
      openToCollaborate: body.openToCollaborate ?? false,
      showActivity: body.showActivity ?? true,
      showContactLinks: body.showContactLinks ?? true,
      emailNotificationsEnabled: body.emailNotificationsEnabled ?? true,
      inAppNotificationsEnabled: body.inAppNotificationsEnabled ?? true,
    });
    return NextResponse.json({ settings });
  } catch (e) {
    console.error("PATCH community profile settings error:", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
