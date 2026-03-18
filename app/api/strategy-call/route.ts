import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";

const STRATEGY_CALL_SUBJECT = "Strategy Call Request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attribution } = extractRequestAttribution(
      req,
      (body && typeof body === "object" ? body : {}) as Record<string, unknown>
    );

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const businessName = String(body.businessName ?? body.company ?? "").trim();
    const website = String(body.website ?? body.websiteUrl ?? "").trim();
    const businessStage = String(body.businessStage ?? "").trim();
    const mainNeed = String(body.mainNeed ?? "").trim();
    const budget = String(body.budget ?? "").trim();
    const timeline = String(body.timeline ?? "").trim();
    const projectGoals = String(body.projectGoals ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    const messageParts = [
      businessName && `Business: ${businessName}`,
      website && `Website: ${website}`,
      businessStage && `Stage: ${businessStage}`,
      mainNeed && `Main need: ${mainNeed}`,
      budget && `Budget: ${budget}`,
      timeline && `Timeline: ${timeline}`,
      projectGoals && `Project goals / what's not working:\n${projectGoals}`,
    ].filter(Boolean);
    const message =
      messageParts.length > 0
        ? messageParts.join("\n")
        : "Strategy call request (no additional details provided).";

    const contactBody = {
      name,
      email,
      company: businessName || undefined,
      phone: undefined,
      projectType: "Strategy Call",
      budget: budget || undefined,
      timeframe: timeline || undefined,
      message,
      newsletter: false,
      subject: STRATEGY_CALL_SUBJECT,
      ageRange: (body.ageRange ?? body.age_range ?? "").trim() || undefined,
      gender: (body.gender ?? "").trim() || undefined,
      occupation: (body.occupation ?? "").trim() || undefined,
      companySize: (body.companySize ?? body.company_size ?? "").trim() || undefined,
      ...attribution,
    };

    const mockReq = {
      body: contactBody,
      headers: {
        "x-forwarded-for": req.headers.get("x-forwarded-for") || "",
        "user-agent": req.headers.get("user-agent") || "",
      },
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1",
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
  } catch (error) {
    console.error("Error in POST /api/strategy-call:", error);
    return NextResponse.json(
      { message: "Failed to submit strategy call request" },
      { status: 500 }
    );
  }
}
