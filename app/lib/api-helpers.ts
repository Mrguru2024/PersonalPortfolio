import { NextRequest, NextResponse } from "next/server";

// Helper to wrap Express controllers for Next.js API routes
export function createMockResponse() {
  let response: NextResponse | null = null;
  
  const mockRes = {
    json: (data: any) => {
      response = NextResponse.json(data);
      return response;
    },
    status: (code: number) => ({
      json: (data: any) => {
        response = NextResponse.json(data, { status: code });
        return response;
      },
    }),
  } as any; // Type assertion to avoid strict type checking with Express Response
  
  return { mockRes, getResponse: () => response };
}
