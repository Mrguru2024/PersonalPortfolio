import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@server/services/emailService";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/data-deletion-request
 * Accepts a data deletion request and notifies the admin by email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const message = typeof body.message === "string" ? body.message.trim() : undefined;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required to process your request." },
        { status: 400 }
      );
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const sent = await emailService.sendNotification({
      type: "data-deletion",
      data: { email, name, message },
    });

    if (!sent) {
      return NextResponse.json(
        { message: "We could not send your request right now. Please try again or contact us directly." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Your data deletion request has been received. We will process it in line with our Privacy Policy and contact you at the email you provided.",
    });
  } catch (error) {
    console.error("Data deletion request error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
