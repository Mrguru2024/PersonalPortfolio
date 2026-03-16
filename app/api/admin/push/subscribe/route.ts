import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { pushSubscriptions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** POST /api/admin/push/subscribe - register a push subscription (admin only) */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json(
        { message: "Session required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const endpoint =
      typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
    const keys = body?.keys;
    if (
      !endpoint ||
      !keys ||
      typeof keys?.p256dh !== "string" ||
      typeof keys?.auth !== "string"
    ) {
      return NextResponse.json(
        { message: "endpoint and keys.p256dh, keys.auth required" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") ?? undefined;
    const keysPayload = { p256dh: keys.p256dh, auth: keys.auth };

    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(pushSubscriptions)
        .set({ keys: keysPayload, userAgent })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      await db.insert(pushSubscriptions).values({
        userId: user.id,
        endpoint,
        keys: keysPayload,
        userAgent,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
