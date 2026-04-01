import { NextResponse } from "next/server";
import { getAscendraOsPublicAccessState } from "@/lib/ascendraOsAccess";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/status — public: whether gated market / OS tools are available to non-admin clients.
 * Use for lead magnets and partner integrations; does not expose subscription state.
 */
export async function GET() {
  try {
    const state = await getAscendraOsPublicAccessState();
    return NextResponse.json({
      publicMarketToolsAvailable: state.effectivePublicAccessEnabled,
    });
  } catch (e) {
    console.error("GET /api/market/status:", e);
    return NextResponse.json({ publicMarketToolsAvailable: false }, { status: 200 });
  }
}
