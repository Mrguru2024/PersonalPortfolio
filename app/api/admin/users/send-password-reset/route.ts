import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { randomBytes } from "crypto";

function getBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin") || req.headers.get("x-forwarded-host");
  if (origin) {
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    return origin.startsWith("http") ? origin : `${protocol}://${origin}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * POST /api/admin/users/send-password-reset
 * Body: { email: string } | { userId: number }
 * Sends a password reset email to the user. Admin only.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const email = body.email as string | undefined;
    const userId = body.userId as number | undefined;

    let user;
    if (userId != null) {
      user = await storage.getUser(userId);
    } else if (email && typeof email === "string" && email.trim()) {
      user = await storage.getUserByEmail(email.trim());
    } else {
      return NextResponse.json(
        { message: "Provide email or userId" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { message: "User has no email; cannot send reset link" },
        { status: 400 }
      );
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    await storage.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    const baseUrl = getBaseUrl(req);
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    try {
      const brevoModule = await import("@getbrevo/brevo");
      const defaultClient = brevoModule.ApiClient.instance;
      const apiKey = defaultClient.authentications["api-key"];
      apiKey.apiKey = process.env.BREVO_API_KEY;
      const apiInstance = new brevoModule.TransactionalEmailsApi();
      const sendSmtpEmail = new brevoModule.SendSmtpEmail();
      sendSmtpEmail.subject = "Password Reset Request - Ascendra Technologies";
      sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h2>Password Reset Request</h2></div>
            <div class="content">
              <p>Hello ${user.username || user.email},</p>
              <p>A password reset was requested for your account (by an admin or by you).</p>
              <p>Click the button below to set a new password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p>If you didn't request this, please ignore this email.</p>
              <div class="footer"><p>Automated message. Do not reply.</p></div>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `Password Reset\n\nHello ${user.username || user.email},\n\nA password reset was requested. Open this link within 1 hour to set a new password:\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n`;
      sendSmtpEmail.sender = {
        name: process.env.FROM_NAME || "Ascendra Technologies",
        email: process.env.FROM_EMAIL || "noreply@mrguru.dev",
      };
      sendSmtpEmail.to = [{ email: user.email }];
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (emailError) {
      console.error("Admin send password reset email error:", emailError);
      return NextResponse.json(
        { message: "Failed to send email. Check BREVO_API_KEY." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Password reset email sent",
      email: user.email,
    });
  } catch (error: unknown) {
    console.error("Admin send-password-reset error:", error);
    return NextResponse.json(
      { message: "Failed to send password reset" },
      { status: 500 }
    );
  }
}
