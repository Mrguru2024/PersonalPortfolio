import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import { projects as staticProjects } from "@/lib/data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const mockReq = {
      params: { id },
    } as any;

    const { mockRes, getResponse } = createMockResponse();
    await portfolioController.getProjectById(mockReq, mockRes);

    const response = getResponse();
    if (!response) {
      const fallback = staticProjects.find((p) => p.id === id);
      if (fallback) return NextResponse.json(fallback);
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }

    return response;
  } catch (error: any) {
    console.error("Error in GET /api/projects/[id]:", error);

    const errorMessage = (error?.message || String(error)).toLowerCase();
    if (
      errorMessage.includes("connection") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("terminated")
    ) {
      const fallback = staticProjects.find((p) => p.id === id);
      if (fallback) {
        console.warn("Database unavailable, returning static project");
        return NextResponse.json(fallback);
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
