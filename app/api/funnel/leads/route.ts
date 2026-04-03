import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { growthFunnelLeads } from "@shared/schema";
import { emailService } from "@server/services/emailService";
import { RECOMMENDATION_LABELS } from "@/lib/scoring";
import { queueAdminInboundNotification } from "@server/services/adminInboxService";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { evaluateScarcityForContext } from "@modules/scarcity-engine";

export const dynamic = "force-dynamic";

/** POST /api/funnel/leads — store growth funnel lead and send emails. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { answers, scores, form } = body;

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
    const scarcity = await evaluateScarcityForContext({
      offerSlug: typeof form.sourceOfferSlug === "string" ? form.sourceOfferSlug : undefined,
      leadMagnetSlug:
        typeof form.sourceLeadMagnetSlug === "string" ? form.sourceLeadMagnetSlug : undefined,
      funnelSlug: typeof form.sourceFunnelSlug === "string" ? form.sourceFunnelSlug : undefined,
      trafficTemperature:
        typeof form.sourceTrafficTemperature === "string" ? form.sourceTrafficTemperature : undefined,
      leadScore: Number.isFinite(totalScore) ? totalScore : undefined,
    }).catch(() => null);

    const derivedConversionStage =
      scarcity?.route === "waitlist"
        ? "waitlist"
        : scarcity?.route === "delayed_intake"
          ? "deferred"
          : scarcity?.route === "nurture"
            ? "nurture"
            : "qualified";
    const derivedQualification =
      !scarcity || scarcity?.route === "qualified_path" ? "qualified" : "nurture_first";

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
        conversionStage: derivedConversionStage,
        qualificationResult: derivedQualification,
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

    queueAdminInboundNotification({
      kind: "growth_funnel",
      title: `Growth funnel lead: ${name}`,
      body: [
        email,
        form.businessName && `Business: ${form.businessName}`,
        form.website && `Site: ${form.website}`,
        `Score: ${totalScore} · Bottleneck: ${primaryBottleneck}`,
      ]
        .filter(Boolean)
        .join("\n"),
      relatedType: "growth_funnel_lead",
      relatedId: inserted.id,
      metadata: { email, totalScore, recommendation },
    });

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
        company: String(form.businessName ?? "").trim() || null,
        attribution: {
          utm_source: typeof form.utm_source === "string" ? form.utm_source : "funnel_quiz",
          utm_medium: typeof form.utm_medium === "string" ? form.utm_medium : null,
          utm_campaign: typeof form.utm_campaign === "string" ? form.utm_campaign : null,
          utm_content: typeof form.utm_content === "string" ? form.utm_content : null,
          utm_term: typeof form.utm_term === "string" ? form.utm_term : null,
          referrer: typeof form.referrer === "string" ? form.referrer : null,
          landing_page: typeof form.landing_page === "string" ? form.landing_page : "/diagnosis",
          visitorId: typeof form.visitorId === "string" ? form.visitorId : null,
          sessionId: typeof form.sessionId === "string" ? form.sessionId : null,
        },
        customFields: {
          intakeSource: "growth_funnel_quiz",
          funnelLeadId: inserted.id,
          sourceOfferSlug: typeof form.sourceOfferSlug === "string" ? form.sourceOfferSlug : undefined,
          sourceLeadMagnetSlug:
            typeof form.sourceLeadMagnetSlug === "string" ? form.sourceLeadMagnetSlug : undefined,
          sourceFunnelSlug: typeof form.sourceFunnelSlug === "string" ? form.sourceFunnelSlug : undefined,
          sourceCampaignSlug: typeof form.sourceCampaignSlug === "string" ? form.sourceCampaignSlug : undefined,
          sourceTrafficTemperature:
            typeof form.sourceTrafficTemperature === "string" ? form.sourceTrafficTemperature : undefined,
          sourceAwarenessLevel:
            typeof form.sourceAwarenessLevel === "string" ? form.sourceAwarenessLevel : undefined,
          sourceConversionStage: derivedConversionStage,
          sourceQualificationResult: derivedQualification,
          ...(scarcity
            ? {
                scarcityConfigId: scarcity.configId,
                scarcityStatus: scarcity.status,
                scarcityRoute: scarcity.route,
                scarcityAvailableSlots: scarcity.availableSlots,
                scarcityUsedSlots: scarcity.usedSlots,
                scarcityWaitlistCount: scarcity.waitlistCount,
                scarcityNextCycleDate: scarcity.nextCycleDate,
                scarcityMessage: scarcity.message,
              }
            : {}),
        },
      });
    } catch (crmErr) {
      console.warn("[funnel-leads] CRM ensure failed:", crmErr);
    }

    return NextResponse.json({
      ok: true,
      id: inserted.id,
      scarcity: scarcity
        ? {
            status: scarcity.status,
            route: scarcity.route,
            availableSlots: scarcity.availableSlots,
            waitlistCount: scarcity.waitlistCount,
            nextCycleDate: scarcity.nextCycleDate,
            message: scarcity.message,
          }
        : null,
    });
  } catch (e) {
    console.error("POST /api/funnel/leads error:", e);
    return NextResponse.json(
      { error: "Server error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
