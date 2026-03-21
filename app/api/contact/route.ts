import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";

export async function GET(req: NextRequest) {
  try {
    const mockReq = {} as any;
    const { mockRes, getResponse } = createMockResponse();
    await portfolioController.getContactInfo(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in GET /api/contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact info" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { attribution } = extractRequestAttribution(
      req,
      (body && typeof body === "object" ? body : {}) as Record<string, unknown>
    );
    const enrichedBody = {
      ...(body && typeof body === "object" ? body : {}),
      ...attribution,
    };
    const mockReq = {
      body: enrichedBody,
      headers: {
        'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
        'user-agent': req.headers.get('user-agent') || '',
      },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1',
    } as any;
    
    const { mockRes, getResponse } = createMockResponse();
    await portfolioController.submitContactForm(mockReq, mockRes);
    
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    console.error("Error in POST /api/contact:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
