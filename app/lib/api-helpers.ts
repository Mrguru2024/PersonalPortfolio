import { NextRequest, NextResponse } from "next/server";

// Helper to wrap Express controllers for Next.js API routes
export function createMockResponse() {
  let response: NextResponse | null = null;
  let statusCode = 200;
  
  const mockRes = {
    json: (data: any) => {
      response = NextResponse.json(data, { status: statusCode });
      return response;
    },
    status: (code: number) => {
      statusCode = code;
      return {
        json: (data: any) => {
          response = NextResponse.json(data, { status: code });
          return response;
        },
        send: (data: any) => {
          response = NextResponse.json(data, { status: code });
          return response;
        },
      };
    },
    send: (data: any) => {
      response = NextResponse.json(data, { status: statusCode });
      return response;
    },
  } as any; // Type assertion to avoid strict type checking with Express Response
  
  return { mockRes, getResponse: () => response };
}
