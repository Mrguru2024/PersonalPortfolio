import { NextRequest, NextResponse } from "next/server";
import { projectAssessmentSchema } from "@shared/assessmentSchema";
import { pricingService } from "@server/services/pricingService";
import { proposalService } from "@server/services/proposalService";
import { db } from "@server/db";
import { projectAssessments, clientQuotes } from "@shared/schema";
import { emailService } from "@server/services/emailService";
import { storage } from "@server/storage";
import { getSessionUser } from "@/lib/auth-helpers";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";
import { sendConversionSignals } from "@server/services/analytics/conversionRouterService";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }
  if (body == null || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body", message: "Request body must be a JSON object" },
      { status: 400 }
    );
  }

  const parseResult = projectAssessmentSchema.safeParse(body);
  if (!parseResult.success) {
    const err = parseResult.error;
    const first = err.errors?.[0];
    const message = first
      ? [first.path.filter(Boolean).join("."), first.message].filter(Boolean).join(": ") || first.message
      : "Validation failed";
    return NextResponse.json(
      { error: "Validation error", message, details: err.errors },
      { status: 400 }
    );
  }
  const validatedData = parseResult.data;
  const trackingPayload =
    body && typeof body === "object" && "tracking" in body && typeof (body as { tracking?: unknown }).tracking === "object"
      ? ((body as { tracking?: Record<string, unknown> }).tracking ?? {})
      : {};
  const { attribution, firstTouch } = extractRequestAttribution(req, trackingPayload);

  try {
    const pricingBreakdown = pricingService.calculatePricing(validatedData);

    const inserted = await db
      .insert(projectAssessments)
      .values({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        role: validatedData.role || null,
        assessmentData: validatedData,
        pricingBreakdown: pricingBreakdown,
        status: "pending",
      })
      .returning();

    const assessment = inserted?.[0];
    if (!assessment || typeof assessment.id !== "number") {
      console.error("[Assessment form] Insert did not return a row:", inserted?.length, inserted);
      return NextResponse.json(
        { error: "Failed to save assessment", message: "Database did not acknowledge the save. Please try again." },
        { status: 500 }
      );
    }
    console.log(
      `[Assessment form] Saved id=${assessment.id} email=${assessment.email} name=${assessment.name}`
    );

    try {
      await ensureCrmLeadFromFormSubmission({
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone || undefined,
        company: validatedData.company || undefined,
        attribution: {
          utm_source: attribution.utm_source ?? null,
          utm_medium: attribution.utm_medium ?? null,
          utm_campaign: attribution.utm_campaign ?? null,
          utm_term: attribution.utm_term ?? null,
          utm_content: attribution.utm_content ?? null,
          gclid: attribution.gclid ?? null,
          fbclid: attribution.fbclid ?? null,
          msclkid: attribution.msclkid ?? null,
          ttclid: attribution.ttclid ?? null,
          referrer: attribution.referrer ?? null,
          landing_page: attribution.landing_page ?? null,
          visitorId: attribution.visitorId ?? null,
          sessionId: attribution.sessionId ?? null,
        },
        customFields: {
          sourceFlow: "project_assessment",
          assessmentId: assessment.id,
          projectType: validatedData.projectType,
          projectName: validatedData.projectName,
          preferredTimeline: validatedData.preferredTimeline,
          budgetRange: validatedData.budgetRange || null,
          platform: validatedData.platform,
          mustHaveFeatures: validatedData.mustHaveFeatures,
          firstTouchSource: firstTouch?.utm_source ?? null,
          firstTouchMedium: firstTouch?.utm_medium ?? null,
          firstTouchCampaign: firstTouch?.utm_campaign ?? null,
        },
      });
    } catch (crmError) {
      console.warn("[Assessment form] CRM upsert failed:", crmError);
    }

    sendConversionSignals({
      eventName: "assessment_submitted",
      visitorId: attribution.visitorId ?? null,
      email: validatedData.email,
      phone: validatedData.phone || null,
      sourceUrl: attribution.url ?? attribution.landing_page ?? null,
      userAgent: req.headers.get("user-agent"),
      ipAddress:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip"),
      attribution: {
        utm_source: attribution.utm_source ?? null,
        utm_medium: attribution.utm_medium ?? null,
        utm_campaign: attribution.utm_campaign ?? null,
        utm_term: attribution.utm_term ?? null,
        utm_content: attribution.utm_content ?? null,
      },
      metadata: {
        assessmentId: assessment.id,
        projectType: validatedData.projectType,
      },
    }).catch(() => {});

    // Send email notification to admin
    const emailSent = await emailService.sendNotification({
      type: 'quote',
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || '',
        company: validatedData.company || '',
        projectType: validatedData.projectType,
        budget: `$${pricingBreakdown.estimatedRange.min.toLocaleString()} - $${pricingBreakdown.estimatedRange.max.toLocaleString()}`,
        timeframe: validatedData.preferredTimeline || 'flexible',
        message: `Project Assessment Completed\n\nProject: ${validatedData.projectName}\nType: ${validatedData.projectType}\n\nA professional proposal with detailed cost breakdown, timeline, and project scope has been generated and is available on the assessment results page.\n\nEstimated Range: $${pricingBreakdown.estimatedRange.min.toLocaleString()} - $${pricingBreakdown.estimatedRange.max.toLocaleString()}\n\nDescription: ${validatedData.projectDescription}\n\nView your proposal: https://mrguru.dev/assessment/results?id=${assessment.id}`,
        newsletter: validatedData.newsletter || false,
      }
    });
    if (!emailSent) {
      console.warn(
        "[Assessment form] Email notification was not sent. Set BREVO_API_KEY and ADMIN_EMAIL in .env.local (or production env) to receive form notifications."
      );
    }

    // Generate proposal automatically (for all budgets)
    let proposal = null;
    try {
      proposal = await proposalService.generateProposal(validatedData, assessment.id);
    } catch (error) {
      console.error("Error generating proposal:", error);
      // Don't fail the request if proposal generation fails
    }

    // Try to link assessment to user if they're logged in
    let userId: number | null = null;
    try {
      const user = await getSessionUser(req);
      if (user) {
        userId = user.id;
      } else {
        // Try to find user by email
        const userByEmail = await storage.getUserByEmail(validatedData.email);
        if (userByEmail) {
          userId = userByEmail.id;
        }
      }
    } catch (error) {
      // User might not be logged in, that's okay
      console.log("No user found for assessment, quote will be created without user link");
    }

    // Create quote from assessment if proposal was generated
    let quote = null;
    if (proposal) {
      try {
        const quoteNumber = `QT-${Date.now()}-${assessment.id}`;
        const finalTotal = proposal.pricing.finalTotal;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

        const [createdQuote] = await db.insert(clientQuotes).values({
          assessmentId: assessment.id,
          userId: userId || null,
          quoteNumber,
          title: `Quote for ${validatedData.projectName}`,
          proposalData: proposal,
          totalAmount: finalTotal,
          status: 'pending',
          validUntil,
        }).returning();
        
        quote = createdQuote;
      } catch (error) {
        console.error("Error creating quote:", error);
        // Don't fail the request if quote creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Assessment saved successfully.",
      assessment: {
        id: assessment.id,
        pricingBreakdown,
        proposalGenerated: !!proposal,
        quoteId: quote?.id,
        requiresAccount: !userId,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Assessment form] Error processing assessment:", err.message, err.stack);
    const isDbError =
      err.message.includes("DATABASE_URL") ||
      err.message.includes("connection") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("column") ||
      err.message.includes("relation");
    return NextResponse.json(
      {
        error: "Failed to process assessment",
        message: isDbError
          ? "A database error occurred. Please try again or contact support."
          : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
