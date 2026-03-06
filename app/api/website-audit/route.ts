import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { storage } from "@server/storage";
import { emailService } from "@server/services/emailService";
import { websiteAudits } from "@shared/schema";
import {
  websiteAuditSchema,
  type WebsiteAuditSubmission,
} from "@shared/websiteAuditSchema";

function isMissingTableError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    msg.includes("website_audits") ||
    msg.includes("relation") ||
    msg.includes("does not exist")
  );
}

function list(items: string[] | undefined): string {
  if (!Array.isArray(items) || items.length === 0) return "None provided";
  return items.map((item) => `• ${item}`).join("\n");
}

function toTitle(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildAuditSummary(data: WebsiteAuditSubmission): string {
  return [
    "FREE WEBSITE AUDIT REQUEST",
    "",
    `Website: ${data.websiteUrl}`,
    `Monthly Revenue Range: ${toTitle(data.monthlyRevenueRange)}`,
    `Main Problem: ${data.mainProblem}`,
    `Business Type: ${toTitle(data.businessType)}`,
    `Preferred Timeline: ${toTitle(data.preferredTimeline)}`,
    `Preferred Contact Method: ${toTitle(data.preferredContactMethod)}`,
    "",
    "Primary Goals:",
    list(data.primaryGoals),
    "",
    "Primary Conversion Actions:",
    list(data.primaryConversionActions),
    "",
    "Priority Pages:",
    list(data.priorityPages),
    "",
    "Top Challenges:",
    data.topChallenges,
    "",
    "Target Audience:",
    data.targetAudience,
    "",
    "Competitors:",
    list(data.competitors),
    "",
    "Focus Keywords:",
    list(data.focusKeywords),
    "",
    "Tracking Tools:",
    list(data.trackingTools),
    "",
    "Ad Platforms:",
    list(data.adPlatforms),
    "",
    `Has Analytics Access: ${data.hasAnalyticsAccess ? "Yes" : "No"}`,
    `Has Search Console Access: ${data.hasSearchConsoleAccess ? "Yes" : "No"}`,
    `Running Ads: ${data.runningAds ? "Yes" : "No"}`,
    `Can Provide Read-only Access: ${data.canProvideReadOnlyAccess ? "Yes" : "No"}`,
    `CMS Platform: ${data.cmsPlatform ? toTitle(data.cmsPlatform) : "Not provided"}`,
    `Custom Stack Details: ${data.customStackDetails || "Not provided"}`,
    `Monthly Sessions: ${data.monthlySessions || "Not provided"}`,
    `Current Conversion Rate: ${data.currentConversionRate || "Not provided"}`,
    `Target Locations: ${data.targetLocations || "Not provided"}`,
    "",
    "Additional Context:",
    data.additionalContext || "Not provided",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        error: "Invalid request body",
        message: "Request body must be a JSON object.",
      },
      { status: 400 }
    );
  }

  const parsed = websiteAuditSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors?.[0];
    const message = first
      ? [first.path.join("."), first.message].filter(Boolean).join(": ")
      : "Validation failed";
    return NextResponse.json(
      {
        error: "Validation error",
        message,
        details: parsed.error.errors,
      },
      { status: 400 }
    );
  }

  const validated = parsed.data;
  const summary = buildAuditSummary(validated);

  try {
    let auditId: number;
    let persistedToContactsFallback = false;

    try {
      const [inserted] = await db
        .insert(websiteAudits)
        .values({
          name: validated.name,
          email: validated.email,
          phone: validated.phone || null,
          company: validated.company || null,
          role: validated.role || null,
          websiteUrl: validated.websiteUrl,
          status: "new",
          auditData: validated,
        })
        .returning({ id: websiteAudits.id });

      if (!inserted || typeof inserted.id !== "number") {
        throw new Error("Website audit insert returned no id.");
      }
      auditId = inserted.id;
    } catch (error) {
      // Backward-compatible fallback: if table is missing, save as contact so leads aren't lost.
      if (!isMissingTableError(error)) throw error;
      const contact = await storage.createContact({
        name: validated.name,
        email: validated.email,
        subject: `Website Audit Request: ${validated.websiteUrl}`,
        message: summary,
        phone: validated.phone || null,
        company: validated.company || null,
        projectType: "website-audit",
        budget: null,
        timeframe: validated.preferredTimeline,
        newsletter: validated.newsletter,
        pricingEstimate: null,
      });
      auditId = contact.id;
      persistedToContactsFallback = true;
    }

    const emailSent = await emailService.sendNotification({
      type: "quote",
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone || "",
        company: validated.company || "",
        projectType: "Website Audit",
        budget: "N/A",
        timeframe: toTitle(validated.preferredTimeline),
        message: summary,
        newsletter: validated.newsletter,
      },
    });

    if (!emailSent) {
      console.warn(
        "[Website audit] Email notification was not sent. Set BREVO_API_KEY and ADMIN_EMAIL to enable notifications."
      );
    }

    return NextResponse.json({
      success: true,
      id: auditId,
      message:
        "Website audit request submitted successfully. We'll review your site and contact you soon.",
      persistedToContactsFallback,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Website audit] Failed to submit request:", err.message, err.stack);
    return NextResponse.json(
      {
        error: "Failed to submit website audit request",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
