import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSuperUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { normalizeEmail, isAllowedOutboundDomain } from "@/lib/email/getSender";
import { getOutboundAllowedDomain } from "@server/services/ionosMail/outboundEnv";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isEmailAuthorized: z.boolean(),
  senderName: z.string().max(200).nullable().optional(),
  senderEmail: z.string().max(320).nullable().optional(),
});

/**
 * PATCH /api/admin/users/[id]/email-identity
 * Super user only — configure IONOS “Send as” identity (allowed domain enforced via env).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json({ message: "Super user access required" }, { status: 403 });
    }

    const userId = Number((await params).id);
    if (!Number.isFinite(userId) || userId < 1) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const domain = getOutboundAllowedDomain();
    let senderEmail: string | null = null;
    let senderName: string | null = null;
    let isEmailAuthorized = parsed.data.isEmailAuthorized;

    if (isEmailAuthorized) {
      const rawEmail = parsed.data.senderEmail?.trim() || "";
      const rawName = parsed.data.senderName?.trim() || null;
      if (!rawEmail || !isAllowedOutboundDomain(rawEmail, domain)) {
        return NextResponse.json(
          {
            error: `senderEmail must be on @${domain}`,
          },
          { status: 400 },
        );
      }
      senderEmail = normalizeEmail(rawEmail);
      senderName = rawName;
    } else {
      isEmailAuthorized = false;
      senderEmail = null;
      senderName = null;
    }

    const [updated] = await db
      .update(users)
      .set({
        isEmailAuthorized,
        senderEmail,
        senderName,
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        isEmailAuthorized: users.isEmailAuthorized,
        senderName: users.senderName,
        senderEmail: users.senderEmail,
      });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    console.error("PATCH /api/admin/users/[id]/email-identity:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
