import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/growth-intelligence/variant — resolve or assign variant for an experiment. Public (no auth). */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const experiment = searchParams.get("experiment") ?? undefined;
    const visitorId = searchParams.get("visitorId") ?? req.headers.get("x-visitor-id") ?? undefined;
    const sessionId = searchParams.get("sessionId") ?? req.headers.get("x-session-id") ?? undefined;

    if (!experiment?.trim() || !visitorId?.trim()) {
      return NextResponse.json(
        { error: "Missing experiment or visitorId" },
        { status: 400 }
      );
    }

    const result = await storage.getOrAssignVariant(experiment.trim(), visitorId.trim(), sessionId?.trim() || null);

    if (!result) {
      return NextResponse.json({ variantKey: null, config: null });
    }

    return NextResponse.json({
      variantKey: result.variantKey,
      config: result.config,
    });
  } catch (error: unknown) {
    console.error("Growth Intelligence variant error:", error);
    return NextResponse.json(
      { error: "Failed to resolve variant" },
      { status: 500 }
    );
  }
}
