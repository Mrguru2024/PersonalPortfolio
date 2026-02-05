import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import { projects as staticProjects } from "@/lib/data";

const PROJECTS_DB_TIMEOUT_MS = 5_000; // 5s – fail fast and return static so homepage loads

export async function GET(req: NextRequest) {
  try {
    const mockReq = {
      query: Object.fromEntries(req.nextUrl.searchParams),
    } as any;

    const { mockRes, getResponse } = createMockResponse();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Database request timeout")),
        PROJECTS_DB_TIMEOUT_MS
      )
    );

    const controllerPromise = portfolioController
      .getProjects(mockReq, mockRes)
      .catch(() => {});

    await Promise.race([controllerPromise, timeoutPromise]);

    const response = getResponse();
    if (!response) {
      console.warn(
        "No response from projects controller, returning static projects"
      );
      return NextResponse.json(staticProjects);
    }

    if (response.status === 500) {
      console.warn(
        "Projects controller returned 500, returning static projects"
      );
      return NextResponse.json(staticProjects);
    }

    return response;
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: string })?.message === "string"
          ? (error as { message: string }).message
          : String(error);
    console.error("Error in GET /api/projects:", msg);

    const errorMessage = msg.toLowerCase();
    const isConnectionError =
      errorMessage.includes("connection") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("econnreset") ||
      errorMessage.includes("terminated") ||
      errorMessage.includes("reset") ||
      errorMessage.includes("timeout");

    if (isConnectionError) {
      console.warn(
        "Database unavailable or timeout, returning static projects"
      );
      return NextResponse.json(staticProjects);
    }

    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
