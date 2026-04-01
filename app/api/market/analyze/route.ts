import { NextRequest, NextResponse } from "next/server";
import { ascendraOsPublicGateResponse } from "@/lib/ascendraOsAccess";

export const dynamic = "force-dynamic";

/**
 * POST /api/market/analyze — placeholder public AMIE-style entry point.
 * Gate with Ascendra OS public access; extend with Census/BLS/Keyword Planner clients and CRM/PPC writes via savedResearchId + integrationHintsJson.
 */
export async function POST(req: NextRequest) {
  const denied = await ascendraOsPublicGateResponse();
  if (denied) return denied;

  void req;
  return NextResponse.json({
    ok: true,
    message:
      "Public market analysis is enabled. Wire this route to shared AMIE pipelines, auth/CORS, and subscription checks as needed.",
    savedResearchId: null as number | null,
    integrationHints: {} as Record<string, unknown>,
  });
}
