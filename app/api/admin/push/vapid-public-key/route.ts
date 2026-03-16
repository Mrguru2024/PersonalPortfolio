import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { pushNotificationService } from "@server/services/pushNotificationService";

export const dynamic = "force-dynamic";

/** GET /api/admin/push/vapid-public-key - VAPID public key for push subscribe (admin only) */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { message: "Admin access required" },
      { status: 403 }
    );
  }
  const key = pushNotificationService.getPublicKey();
  return NextResponse.json({ vapidPublicKey: key ?? null });
}
