import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { growthFunnelLeads } from "@shared/schema";
import { emailService } from "@server/services/emailService";
import { RECOMMENDATION_LABELS } from "@/lib/scoring";

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

    return NextResponse.json({ ok: true, id: inserted.id });
  } catch (e) {
    console.error("POST /api/funnel/leads error:", e);
    return NextResponse.json(
      { error: "Server error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
