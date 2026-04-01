import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { offerValuations } from "@shared/schema";
import {
  canAccessOfferValuationEngine,
  calculateOfferValuation,
  getOfferValuationAccessSettings,
  isApprovedAdminUser,
  offerValuationCreateSchema,
} from "@modules/offer-valuation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/offer-valuation/valuations */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const settings = await getOfferValuationAccessSettings();
    if (!canAccessOfferValuationEngine(user, settings)) {
      return NextResponse.json(
        { error: "Offer Valuation is not available for your account" },
        { status: 403 },
      );
    }

    const params = req.nextUrl.searchParams;
    const scope = params.get("scope");
    const q = params.get("q")?.trim();
    const admin = isApprovedAdminUser(user);

    const conditions = [];
    if (!(admin && scope === "all")) {
      conditions.push(eq(offerValuations.userId, user.id));
    }
    if (q) {
      conditions.push(ilike(offerValuations.offerName, `%${q}%`));
    }

    const rows = await db
      .select()
      .from(offerValuations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(offerValuations.createdAt))
      .limit(200);

    return NextResponse.json({ valuations: rows });
  } catch (e) {
    console.error("[GET /api/offer-valuation/valuations]", e);
    return NextResponse.json(
      { error: "Failed to load offer valuations" },
      { status: 500 },
    );
  }
}

/** POST /api/offer-valuation/valuations */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const settings = await getOfferValuationAccessSettings();
    if (!canAccessOfferValuationEngine(user, settings)) {
      return NextResponse.json(
        { error: "Offer Valuation is not available for your account" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = offerValuationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const isAdmin = isApprovedAdminUser(user);
    const ownerUserId =
      isAdmin && parsed.data.userId ? parsed.data.userId : user.id;

    const result = calculateOfferValuation(parsed.data);
    const now = new Date();

    const [created] = await db
      .insert(offerValuations)
      .values({
        userId: ownerUserId,
        persona: parsed.data.persona,
        offerName: parsed.data.offerName,
        description: parsed.data.description ?? null,
        dreamOutcomeScore: parsed.data.dreamOutcomeScore,
        likelihoodScore: parsed.data.likelihoodScore,
        timeDelayScore: parsed.data.timeDelayScore,
        effortScore: parsed.data.effortScore,
        finalScore: result.finalScore,
        insights: result.insights,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ valuation: created }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/offer-valuation/valuations]", e);
    return NextResponse.json(
      { error: "Failed to save offer valuation" },
      { status: 500 },
    );
  }
}
