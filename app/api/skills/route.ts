import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import {
  frontendSkills as staticFrontend,
  backendSkills as staticBackend,
  devopsSkills as staticDevops,
  additionalSkills,
} from "@/lib/data";

const SKILLS_DB_TIMEOUT_MS = 8_000;

function getStaticSkillsResponse() {
  const toSkill = (
    s: { name: string; percentage: number },
    cat: string,
    i: number
  ) => ({
    id: i,
    name: s.name,
    percentage: s.percentage,
    category: cat,
    endorsement_count: 0,
  });
  let id = 0;
  return {
    frontend: staticFrontend.map((s) => toSkill(s, "frontend", ++id)),
    backend: staticBackend.map((s) => toSkill(s, "backend", ++id)),
    devops: staticDevops.map((s) => toSkill(s, "devops", ++id)),
    additional: additionalSkills.map((name) =>
      toSkill({ name, percentage: 70 }, "additional", ++id)
    ),
  };
}

export async function GET(req: NextRequest) {
  try {
    const mockReq = {
      query: Object.fromEntries(req.nextUrl.searchParams),
    } as any;

    const { mockRes, getResponse } = createMockResponse();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Database request timeout")),
        SKILLS_DB_TIMEOUT_MS
      )
    );

    const controllerPromise = portfolioController
      .getSkills(mockReq, mockRes)
      .catch(() => {});

    await Promise.race([controllerPromise, timeoutPromise]);

    const response = getResponse();
    if (!response || response.status === 500) {
      console.warn(
        "Skills controller failed or returned 500, using static skills"
      );
      return NextResponse.json(getStaticSkillsResponse());
    }

    return response;
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error
        ? error.message
        : typeof (error as { message?: string })?.message === "string"
          ? (error as { message: string }).message
          : String(error);
    console.error("Error in GET /api/skills:", errMsg);

    const msg = errMsg.toLowerCase();
    const isConnectionError =
      msg.includes("connection") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("terminated") ||
      msg.includes("reset") ||
      msg.includes("timeout");

    if (isConnectionError) {
      console.warn("Database/GitHub unavailable, returning static skills");
      return NextResponse.json(getStaticSkillsResponse());
    }

    return NextResponse.json(getStaticSkillsResponse());
  }
}
