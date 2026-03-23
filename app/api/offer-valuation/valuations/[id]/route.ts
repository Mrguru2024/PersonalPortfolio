import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { offerValuations } from "@shared/schema";
import {
  canAccessOfferValuationEngine,
  calculateOfferValuation,
  getOfferValuationAccessSettings,
  isApprovedAdminUser,
  offerValuationPatchSchema,
} from "@modules/offer-valuation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function resolveRow(id: number) {
  const [row] = await db
    .select()
    .from(offerValuations)
    .where(eq(offerValuations.id, id))
    .limit(1);
  return row ?? null;
}

/** GET /api/offer-valuation/valuations/[id] */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const id = Number.parseInt((await params).id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const row = await resolveRow(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = isApprovedAdminUser(user);
    if (!isAdmin && row.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ valuation: row });
  } catch (e) {
    console.error("[GET /api/offer-valuation/valuations/[id]]", e);
    return NextResponse.json(
      { error: "Failed to load valuation" },
      { status: 500 },
    );
  }
}

/** PATCH /api/offer-valuation/valuations/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const id = Number.parseInt((await params).id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const row = await resolveRow(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = isApprovedAdminUser(user);
    if (!isAdmin && row.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = offerValuationPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const nextInput = {
      persona: parsed.data.persona ?? row.persona,
      offerName: parsed.data.offerName ?? row.offerName,
      description: parsed.data.description ?? row.description,
      dreamOutcomeScore:
        parsed.data.dreamOutcomeScore ?? row.dreamOutcomeScore,
      likelihoodScore: parsed.data.likelihoodScore ?? row.likelihoodScore,
      timeDelayScore: parsed.data.timeDelayScore ?? row.timeDelayScore,
      effortScore: parsed.data.effortScore ?? row.effortScore,
    };

    const result = calculateOfferValuation(nextInput);

    const [updated] = await db
      .update(offerValuations)
      .set({
        persona: nextInput.persona,
        offerName: nextInput.offerName,
        description: nextInput.description ?? null,
        dreamOutcomeScore: nextInput.dreamOutcomeScore,
        likelihoodScore: nextInput.likelihoodScore,
        timeDelayScore: nextInput.timeDelayScore,
        effortScore: nextInput.effortScore,
        finalScore: result.finalScore,
        insights: result.insights,
        updatedAt: new Date(),
      })
      .where(eq(offerValuations.id, id))
      .returning();

    return NextResponse.json({ valuation: updated });
  } catch (e) {
    console.error("[PATCH /api/offer-valuation/valuations/[id]]", e);
    return NextResponse.json(
      { error: "Failed to update valuation" },
      { status: 500 },
    );
  }
}

/** DELETE /api/offer-valuation/valuations/[id] */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const id = Number.parseInt((await params).id, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const row = await resolveRow(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = isApprovedAdminUser(user);
    if (!isAdmin && row.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(offerValuations).where(eq(offerValuations.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/offer-valuation/valuations/[id]]", e);
    return NextResponse.json(
      { error: "Failed to delete valuation" },
      { status: 500 },
    );
  }
}
