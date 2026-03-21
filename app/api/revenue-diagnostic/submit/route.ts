import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@server/db";
import { revenueDiagnostics } from "@shared/schema";
import { ensureCrmLeadFromFormSubmission } from "@server/services/leadFromFormService";
import { runRevenueDiagnostic, normalizePersona } from "@/lib/revenue-system/diagnosticEngine";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const payloadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  companyName: z.string().optional().nullable(),
  businessType: z.string().optional().nullable(),
  persona: z.string().optional().nullable(),
  systems: z.object({
    visibility: z.number().min(1).max(5),
    conversion: z.number().min(1).max(5),
    trust: z.number().min(1).max(5),
    followUp: z.number().min(1).max(5),
    capture: z.number().min(1).max(5),
    retention: z.number().min(1).max(5),
  }),
  pains: z.array(z.string()).default([]),
  monthlyRevenue: z.number().min(0),
  avgDealValue: z.number().min(0),
  monthlyLeads: z.number().min(0),
  closeRatePercent: z.number().min(0).max(100),
  attribution: z
    .object({
      utm_source: z.string().optional().nullable(),
      utm_medium: z.string().optional().nullable(),
      utm_campaign: z.string().optional().nullable(),
      referrer: z.string().optional().nullable(),
      landing_page: z.string().optional().nullable(),
      visitorId: z.string().optional().nullable(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const persona = normalizePersona(input.persona ?? input.businessType);
    const result = runRevenueDiagnostic({
      ...input,
      persona,
      companyName: input.companyName ?? undefined,
      businessType: input.businessType ?? undefined,
      pains: input.pains,
    });

    const crmLead = await ensureCrmLeadFromFormSubmission({
      email: input.email,
      name: input.fullName,
      company: input.companyName ?? undefined,
      attribution: input.attribution ?? null,
      customFields: {
        revenueDiagnostic: {
          overallScore: result.overallScore,
          websitePerformanceScore: result.websitePerformanceScore,
          startupWebsiteScore: result.startupWebsiteScore,
          categoryScores: result.categoryScores,
          topBottlenecks: result.topBottlenecks,
          recommendation: result.recommendation,
          revenueOpportunityEstimate: result.revenueOpportunityEstimate,
          completedAt: new Date().toISOString(),
        },
      },
    });

    const [row] = await db
      .insert(revenueDiagnostics)
      .values({
        crmContactId: crmLead?.id ?? null,
        fullName: input.fullName,
        email: input.email,
        companyName: input.companyName ?? null,
        businessType: input.businessType ?? null,
        persona,
        monthlyRevenue: Math.round(input.monthlyRevenue),
        avgDealValue: Math.round(input.avgDealValue),
        monthlyLeads: Math.round(input.monthlyLeads),
        closeRatePercent: Math.round(input.closeRatePercent),
        categoryScores: result.categoryScores,
        websitePerformanceScore: result.websitePerformanceScore,
        startupWebsiteScore: result.startupWebsiteScore,
        overallScore: result.overallScore,
        revenueOpportunityEstimate: result.revenueOpportunityEstimate,
        topBottlenecks: result.topBottlenecks,
        recommendation: result.recommendation,
        answers: {
          systems: input.systems,
          pains: input.pains,
        },
        updatedAt: new Date(),
      })
      .returning();

    if (input.attribution?.visitorId && crmLead?.id) {
      await storage
        .createVisitorActivity({
          visitorId: input.attribution.visitorId,
          leadId: crmLead.id,
          sessionId: null,
          pageVisited: "/revenue-diagnostic",
          eventType: "diagnostic_complete",
          metadata: {
            diagnosticId: row.id,
            overallScore: result.overallScore,
            recommendation: result.recommendation.systemKey,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      diagnosticId: row.id,
      crmContactId: crmLead?.id ?? null,
      result,
    });
  } catch (error) {
    console.error("POST /api/revenue-diagnostic/submit error:", error);
    return NextResponse.json(
      { error: "Server error", message: "Failed to complete diagnostic." },
      { status: 500 },
    );
  }
}
