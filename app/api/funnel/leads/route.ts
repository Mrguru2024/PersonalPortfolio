import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { growthFunnelLeads } from "@shared/schema";
import { emailService } from "@server/services/emailService";
import { RECOMMENDATION_LABELS } from "@/lib/scoring";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";
import { sendConversionSignals } from "@server/services/analytics/conversionRouterService";

export const dynamic = "force-dynamic";

/** POST /api/funnel/leads — store growth funnel lead and send emails. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { answers, scores, form } = body;
    const trackingPayload =
      body && typeof body === "object" && body.tracking && typeof body.tracking === "object"
        ? (body.tracking as Record<string, unknown>)
        : {};
    const { attribution, firstTouch } = extractRequestAttribution(req, trackingPayload);

    if (!scores || typeof scores !== "object" || !form || typeof form !== "object") {
      return NextResponse.json(
        { error: "Invalid payload", message: "answers, scores, and form are required" },
        { status: 400 }
      );
    }

    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "").trim();
    if (!name || !email) {
      return NextResponse.json(
        { error: "Validation error", message: "Name and email are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Validation error", message: "Enter a valid email" },
        { status: 400 }
      );
    }

    const totalScore = Number(scores.totalScore) || 0;
    const brandScore = Number(scores.brandScore) || 0;
    const designScore = Number(scores.designScore) || 0;
    const systemScore = Number(scores.systemScore) || 0;
    const primaryBottleneck = String(scores.primaryBottleneck ?? "system");
    const recommendation = String(scores.recommendation ?? "ascendra");

    const [inserted] = await db
      .insert(growthFunnelLeads)
      .values({
        answers: typeof answers === "object" && answers !== null ? answers : {},
        totalScore,
        brandScore,
        designScore,
        systemScore,
        primaryBottleneck,
        recommendation,
        name,
        email,
        businessName: String(form.businessName ?? "").trim() || null,
        website: String(form.website ?? "").trim() || null,
        monthlyRevenue: String(form.monthlyRevenue ?? "").trim() || null,
        mainChallenge: String(form.mainChallenge ?? "").trim() || null,
        timeline: String(form.timeline ?? "").trim() || null,
        budgetRange: String(form.budgetRange ?? "").trim() || null,
      })
      .returning();

    if (!inserted) {
      return NextResponse.json(
        { error: "Failed to save", message: "Could not save lead. Please try again." },
        { status: 500 }
      );
    }

    const recommendationLabel = RECOMMENDATION_LABELS[recommendation as keyof typeof RECOMMENDATION_LABELS] ?? recommendation;

    await Promise.all([
      emailService.sendGrowthDiagnosisToUser({
        to: email,
        name,
        totalScore,
        primaryBottleneck,
        recommendation,
        recommendationLabel,
      }),
      emailService.sendGrowthLeadToAdmin({
        name,
        email,
        businessName: String(form.businessName ?? "").trim(),
        website: String(form.website ?? "").trim() || undefined,
        monthlyRevenue: String(form.monthlyRevenue ?? "").trim(),
        mainChallenge: String(form.mainChallenge ?? "").trim(),
        timeline: String(form.timeline ?? "").trim(),
        budgetRange: String(form.budgetRange ?? "").trim(),
        totalScore,
        brandScore,
        designScore,
        systemScore,
        primaryBottleneck,
        recommendation: recommendationLabel,
      }),
    ]);

    try {
      await ensureCrmLeadFromFormSubmission({
        email,
        name,
        company: String(form.businessName ?? "").trim() || undefined,
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
          growthDiagnosisLeadId: inserted.id,
          sourceFlow: "growth_diagnosis_apply",
          recommendation,
          primaryBottleneck,
          totalScore,
          brandScore,
          designScore,
          systemScore,
          monthlyRevenue: String(form.monthlyRevenue ?? "").trim() || null,
          mainChallenge: String(form.mainChallenge ?? "").trim() || null,
          timeline: String(form.timeline ?? "").trim() || null,
          budgetRange: String(form.budgetRange ?? "").trim() || null,
          firstTouchSource: firstTouch?.utm_source ?? null,
          firstTouchMedium: firstTouch?.utm_medium ?? null,
          firstTouchCampaign: firstTouch?.utm_campaign ?? null,
        },
      });
    } catch (crmError) {
      console.warn("[Growth funnel leads] CRM upsert failed:", crmError);
    }

    sendConversionSignals({
      eventName: "growth_apply_submitted",
      visitorId: attribution.visitorId ?? null,
      email,
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
        recommendation,
        primaryBottleneck,
        totalScore,
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: inserted.id });
  } catch (e) {
    console.error("POST /api/funnel/leads error:", e);
    return NextResponse.json(
      { error: "Server error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
