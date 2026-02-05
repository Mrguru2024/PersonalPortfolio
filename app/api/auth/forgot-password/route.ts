import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { randomBytes } from "crypto";
import { emailService } from "@server/services/emailService";

export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json();

    if (!email && !username) {
      return NextResponse.json(
        { message: "Email or username is required" },
        { status: 400 }
      );
    }

    // Find user by email or username
    let user;
    if (email) {
      user = await storage.getUserByEmail(email);
    } else {
      user = await storage.getUserByUsername(username);
    }

    // Don't reveal if user exists or not (security best practice)
    // But we still need to send email, so we'll check if user exists
    if (!user || !user.email) {
      // Return success even if user doesn't exist (security)
      return NextResponse.json({
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    await storage.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    // Send reset email
    const resetUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"
    }/auth/reset-password?token=${resetToken}`;

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
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Hello ${user.username || user.email},</p>
              <p>You requested to reset your password for your Ascendra Technologies account.</p>
              <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      sendSmtpEmail.textContent = `
Password Reset Request

Hello ${user.username || user.email},

You requested to reset your password for your Ascendra Technologies account.

Click the link below to reset your password. This link will expire in 1 hour.

${resetUrl}

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This is an automated message. Please do not reply to this email.
      `;
      sendSmtpEmail.sender = {
        name: process.env.FROM_NAME || "Ascendra Technologies",
        email: process.env.FROM_EMAIL || "noreply@mrguru.dev",
      };
      sendSmtpEmail.to = [{ email: user.email }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Still return success to not reveal if email exists
    }

    return NextResponse.json({
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Error processing password reset request" },
      { status: 500 }
    );
  }
}
