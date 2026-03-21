import { NextRequest, NextResponse } from "next/server";
import { portfolioController } from "@server/controllers/portfolioController";
import { createMockResponse } from "@/lib/api-helpers";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";

const AUDIT_SUBJECT = "Digital Growth Audit Request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attribution } = extractRequestAttribution(
      req,
      (body && typeof body === "object" ? body : {}) as Record<string, unknown>
    );

    const businessName = String(body.businessName ?? body.company ?? "").trim();
    const name = String(body.name ?? body.contactName ?? businessName).trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim() || undefined;
    const websiteUrl = String(body.websiteUrl ?? body.website ?? "").trim() || "";
    const industry = String(body.industry ?? "").trim();
    const budgetRange = String(
      body.budgetRange ?? body.revenueRange ?? body.monthlyRevenue ?? ""
    ).trim();
    const mainChallenge = String(
      body.mainChallenge ?? body.currentChallenge ?? body.challenge ?? ""
    ).trim();
    const businessStage = String(body.businessStage ?? body.currentStage ?? "").trim();
    const helpNeeded =
      Array.isArray(body.helpNeeded) && body.helpNeeded.length > 0
        ? body.helpNeeded.map((value: unknown) => String(value).trim()).filter(Boolean)
        : [];
    const timeline = String(body.timeline ?? "").trim();
    const notes = String(body.notes ?? body.extraNotes ?? "").trim();

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
      businessStage && `Business stage: ${businessStage}`,
      helpNeeded.length > 0 && `Help needed: ${helpNeeded.join(", ")}`,
      budgetRange && `Budget range: ${budgetRange}`,
      timeline && `Timeline: ${timeline}`,
      notes && `Additional notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    const contactBody = {
      name,
      email,
      company: businessName || undefined,
      phone: phone || undefined,
      projectType: [industry, businessStage].filter(Boolean).join(" | ") || undefined,
      budget: budgetRange || undefined,
      timeframe: timeline || undefined,
      message: message || "Digital Growth Audit request",
      newsletter: false,
      subject: AUDIT_SUBJECT,
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
    console.error("Error in POST /api/audit:", error);
    return NextResponse.json(
      { message: "Failed to submit audit request" },
      { status: 500 }
    );
  }
}
