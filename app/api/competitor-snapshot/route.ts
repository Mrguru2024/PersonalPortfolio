import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";

const SUBJECT = "Competitor Position Snapshot Request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attribution } = extractRequestAttribution(
      req,
      (body && typeof body === "object" ? body : {}) as Record<string, unknown>
    );
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const businessName = String(body.businessName ?? "").trim();
    const websiteUrl = String(body.websiteUrl ?? "").trim();
    const industry = String(body.industry ?? "").trim();
    const city = String(body.city ?? "").trim();
    const mainService = String(body.mainService ?? "").trim();
    const competitors = [
      body.competitor1,
      body.competitor2,
      body.competitor3,
    ]
      .filter(Boolean)
      .map((c: unknown) => String(c).trim())
      .filter(Boolean);

    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    const message = [
      businessName && `Business: ${businessName}`,
      websiteUrl && `Website: ${websiteUrl}`,
      industry && `Industry: ${industry}`,
      city && `City / market: ${city}`,
      mainService && `Main service: ${mainService}`,
      competitors.length > 0 && `Competitors: ${competitors.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const contactBody = {
      name,
      email,
      company: businessName || undefined,
      phone: undefined,
      projectType: "Competitor Position Snapshot",
      message: message || "Competitor snapshot request",
      newsletter: false,
      subject: SUBJECT,
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
    await portfolioController.submitContactForm(mockReq, mockRes as any);
    const response = getResponse();
    if (!response) {
      return NextResponse.json(
        { error: "No response from controller" },
        { status: 500 }
      );
    }
    return response;
  } catch (error) {
    console.error("Error in POST /api/competitor-snapshot:", error);
    return NextResponse.json(
      { message: "Failed to submit snapshot request" },
      { status: 500 }
    );
  }
}
