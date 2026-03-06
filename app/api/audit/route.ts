import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";

const AUDIT_SUBJECT = "Website Growth Audit Request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const businessName = String(body.businessName ?? body.company ?? "").trim();
    const name = String(body.name ?? body.contactName ?? businessName).trim();
    const email = String(body.email ?? "").trim();
    const websiteUrl = String(body.websiteUrl ?? body.website ?? "").trim() || "";
    const industry = String(body.industry ?? "").trim();
    const revenueRange = String(body.revenueRange ?? body.monthlyRevenue ?? "").trim();
    const mainChallenge = String(body.mainChallenge ?? body.challenge ?? "").trim();
    const timeline = String(body.timeline ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    const message = [
      mainChallenge && `Main challenge: ${mainChallenge}`,
      websiteUrl && `Website: ${websiteUrl}`,
      industry && `Industry: ${industry}`,
      revenueRange && `Monthly revenue range: ${revenueRange}`,
      timeline && `Timeline: ${timeline}`,
    ]
      .filter(Boolean)
      .join("\n");

    const contactBody = {
      name,
      email,
      company: businessName || undefined,
      phone: undefined,
      projectType: industry || undefined,
      budget: revenueRange || undefined,
      timeframe: timeline || undefined,
      message: message || "Website Growth Audit request",
      newsletter: false,
      subject: AUDIT_SUBJECT,
    };

    const mockReq = {
      body: contactBody,
      headers: {
        "x-forwarded-for": req.headers.get("x-forwarded-for") || "",
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
    console.error("Error in POST /api/audit:", error);
    return NextResponse.json(
      { message: "Failed to submit audit request" },
      { status: 500 }
    );
  }
}
