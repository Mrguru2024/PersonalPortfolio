import { NextRequest, NextResponse } from "next/server";
import { recommendationController } from "@server/controllers/recommendationController";
import { createMockResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mockReq = {
      body,
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await recommendationController.getRecommendations(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in POST /api/recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
