import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mockReq = {
      body,
      headers: {
        'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
      },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1',
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await portfolioController.requestResume(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in POST /api/resume/request:", error);
    return NextResponse.json(
      { error: "Failed to submit resume request" },
      { status: 500 }
    );
  }
}
