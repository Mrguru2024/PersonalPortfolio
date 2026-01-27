import { NextRequest, NextResponse } from "next/server";
import { pricingService } from "@server/services/pricingService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Calculate pricing based on current answers
    const pricingBreakdown = pricingService.calculatePricing(body);
    
    return NextResponse.json({
      success: true,
      pricing: pricingBreakdown,
    });
  } catch (error: any) {
    console.error("Error calculating pricing:", error);
    return NextResponse.json(
      { error: "Failed to calculate pricing" },
      { status: 500 }
    );
  }
}
