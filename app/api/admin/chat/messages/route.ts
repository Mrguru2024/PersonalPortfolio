import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import {
  adminChatMessages,
  users,
  type InsertAdminChatMessage,
} from "@shared/schema";
import { desc, eq, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/** GET /api/admin/chat/messages - list messages (newest first), optional ?limit= & ?before=id */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(
        parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) ||
          DEFAULT_LIMIT,
        1
      ),
      MAX_LIMIT
    );
    const beforeId = url.searchParams.get("before");
    const before = beforeId ? parseInt(beforeId, 10) : null;

    const limitNum = Math.min(limit, MAX_LIMIT);
    const rows =
      before != null && !Number.isNaN(before)
        ? await db
            .select({
              id: adminChatMessages.id,
              senderId: adminChatMessages.senderId,
              content: adminChatMessages.content,
              createdAt: adminChatMessages.createdAt,
              senderUsername: users.username,
              senderEmail: users.email,
            })
            .from(adminChatMessages)
            .innerJoin(users, eq(adminChatMessages.senderId, users.id))
            .where(lt(adminChatMessages.id, before))
            .orderBy(desc(adminChatMessages.id))
            .limit(limitNum)
        : await db
            .select({
              id: adminChatMessages.id,
              senderId: adminChatMessages.senderId,
              content: adminChatMessages.content,
              createdAt: adminChatMessages.createdAt,
              senderUsername: users.username,
              senderEmail: users.email,
            })
            .from(adminChatMessages)
            .innerJoin(users, eq(adminChatMessages.senderId, users.id))
            .orderBy(desc(adminChatMessages.id))
            .limit(limitNum);

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        senderId: r.senderId,
        content: r.content,
        createdAt: r.createdAt,
        senderUsername: r.senderUsername,
        senderEmail: r.senderEmail ?? undefined,
      }))
    );
  } catch (error: unknown) {
    console.error("Error fetching admin chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/** POST /api/admin/chat/messages - send a message; optional channels: email, SMS, push */
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
    const content =
      typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }
    if (content.length > 8000) {
      return NextResponse.json(
        { message: "Message too long" },
        { status: 400 }
      );
    }

    const alsoSendEmail = !!body?.alsoSendEmail;
    const alsoSendSms = !!body?.alsoSendSms;
    const alsoSendPush = !!body?.alsoSendPush;
    const recipientEmail =
      typeof body?.recipientEmail === "string"
        ? body.recipientEmail.trim()
        : null;
    const recipientPhone =
      typeof body?.recipientPhone === "string"
        ? body.recipientPhone.trim()
        : null;

    const [inserted] = await db
      .insert(adminChatMessages)
      .values({
        senderId: user.id,
        content,
      } as InsertAdminChatMessage)
      .returning({
        id: adminChatMessages.id,
        senderId: adminChatMessages.senderId,
        content: adminChatMessages.content,
        createdAt: adminChatMessages.createdAt,
      });

    const delivery: { email?: boolean; sms?: boolean; push?: number } = {};

    if (inserted) {
      if (alsoSendEmail) {
        const { emailService } = await import("@server/services/emailService");
        const to =
          recipientEmail ||
          process.env.ADMIN_EMAIL ||
          (user.email as string) ||
          "";
        if (to) {
          const ok = await emailService.sendDirectMessageEmail({
            to,
            subject: `Direct message from ${user.username}`,
            body: content,
            senderName: user.username,
          });
          delivery.email = ok;
        }
      }
      if (alsoSendSms) {
        const { sendSms } = await import("@server/services/smsService");
        const phone =
          recipientPhone || process.env.ADMIN_PHONE || "";
        if (phone) {
          const result = await sendSms(phone, content.slice(0, 320));
          delivery.sms = result.ok;
        }
      }
      if (alsoSendPush) {
        const { pushNotificationService } = await import(
          "@server/services/pushNotificationService"
        );
        const { pushSubscriptions } = await import("@shared/schema");
        const subs = await db
          .select({
            endpoint: pushSubscriptions.endpoint,
            keys: pushSubscriptions.keys,
          })
          .from(pushSubscriptions);
        const payloads = subs
          .filter((s) => s.keys && typeof s.keys === "object" && "p256dh" in s.keys && "auth" in s.keys)
          .map((s) => ({
            endpoint: s.endpoint,
            keys: s.keys as { p256dh: string; auth: string },
          }));
        const sent = await pushNotificationService.sendToSubscriptions(
          payloads,
          {
            title: `Message from ${user.username}`,
            body: content.slice(0, 200),
            tag: "admin-chat",
          }
        );
        delivery.push = sent;
      }
    }

    return NextResponse.json({
      id: inserted.id,
      senderId: inserted.senderId,
      content: inserted.content,
      createdAt: inserted.createdAt,
      senderUsername: user.username,
      senderEmail: user.email ?? undefined,
      delivery,
    });
  } catch (error: unknown) {
    console.error("Error sending admin chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
