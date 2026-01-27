import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const mockReq = {} as any;
    const { mockRes, getResponse } = createMockResponse();
    await portfolioController.getPersonalInfo(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in GET /api/info:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal info" },
      { status: 500 }
    );
  }
}
