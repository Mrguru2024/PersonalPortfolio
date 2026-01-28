import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

const feedbackSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z
    .enum(["general", "quote", "project", "invoice", "support"])
    .default("general"),
  assessmentId: z.number().optional(),
  quoteId: z.number().optional(),
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const feedback = await storage.getClientFeedback(user.id);
    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("Error fetching client feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validatedData = feedbackSchema.parse(body);

    const feedback = await storage.createClientFeedback({
      userId: user.id,
      subject: validatedData.subject,
      message: validatedData.message,
      category: validatedData.category,
      assessmentId: validatedData.assessmentId,
      quoteId: validatedData.quoteId,
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 },
    );
  }
}
