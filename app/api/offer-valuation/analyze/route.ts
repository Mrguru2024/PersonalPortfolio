import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSessionUser,
  resolveAscendraAccessFromSessionUser,
} from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  runOfferValuation,
  suggestOfferScoresFromDescription,
} from "@server/services/offerValuationService";
import { canUseOfferValuation } from "../lib";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  persona: z.string().trim().max(120).optional().nullable(),
  offerName: z.string().trim().min(1, "Offer name is required").max(200),
  description: z
    .string()
    .trim()
    .min(20, "Offer description is required")
    .max(8000),
});

export async function POST(req: NextRequest) {
  try {
    const settings = await storage.getOfferValuationSettings();
    const sessionUser = await getSessionUser(req);
    const role = resolveAscendraAccessFromSessionUser(sessionUser);
    const access = canUseOfferValuation(settings, role);
    if (!access.allowed) {
      return NextResponse.json(
        { message: access.reason ?? "Access denied" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const suggestion = await suggestOfferScoresFromDescription(parsed.data);
    const valuation = await runOfferValuation({
      persona: parsed.data.persona,
      offerName: parsed.data.offerName,
      description: parsed.data.description,
      scores: suggestion.suggestedScores,
      aiEnabled: true,
    });

    return NextResponse.json({
      suggestedScores: suggestion.suggestedScores,
      aiUsed: suggestion.aiUsed,
      summary: suggestion.summary,
      preview: {
        rawScore: valuation.rawScore,
        finalScore: valuation.finalScore,
        scoreBand: valuation.scoreBand,
        valueEquation: valuation.valueEquation,
      },
      insights: valuation.insights,
    });
  } catch (error) {
    console.error("POST /api/offer-valuation/analyze:", error);
    return NextResponse.json(
      { message: "Failed to run AI offer analysis" },
      { status: 500 },
    );
  }
}

