import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { queueAdminInboundNotification } from "@server/services/adminInboxService";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1).max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, name } = parsed.data;
    const subscriber = await storage.createSubscriber({
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
      subscribed: true,
      source: "blog_comment",
    });

    queueAdminInboundNotification({
      kind: "newsletter_subscribe",
      title: `Newsletter subscriber: ${email.trim()}`,
      body: name?.trim() ? `Name: ${name.trim()}` : undefined,
      relatedType: "newsletter_subscriber",
      relatedId: subscriber.id,
      metadata: { email: subscriber.email, source: "blog_comment_gate" },
    });

    return NextResponse.json(
      { message: "You're subscribed. You can now leave a comment.", subscriber: { id: subscriber.id, email: subscriber.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/newsletter/subscribe:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
