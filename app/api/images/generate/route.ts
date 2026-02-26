import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { generateImage, validatePrompt } from "@server/services/imageGenerationService";
import { z } from "zod";

const generateImageSchema = z.object({
  prompt: z.string().min(10).max(1000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
});

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = generateImageSchema.safeParse(body);

    if (!result.success) {
      const first = result.error.flatten().fieldErrors;
      const msg =
        first.prompt?.join(" ") ||
        (body?.prompt == null
          ? "Prompt is required (10–1000 characters)."
          : "Invalid request parameters.");
      return NextResponse.json(
        {
          success: false,
          message: msg,
          error: "Invalid request parameters",
          details: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { prompt, size, quality } = result.data;

    if (!validatePrompt(prompt)) {
      return NextResponse.json(
        {
          success: false,
          message:
            prompt.trim().length < 10
              ? "Prompt must be at least 10 characters."
              : "Prompt must be at most 1000 characters.",
          error: "Invalid prompt content",
        },
        { status: 400 }
      );
    }
    
    // Generate the image
    const image = await generateImage(prompt, size, quality);
    
    // Return the generated image information
    return NextResponse.json({
      success: true,
      data: image,
    });
  } catch (error: unknown) {
    console.error("Error in image generation:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const msg = errorMessage.toLowerCase();
    if (msg.includes("openai_api_key") || (msg.includes("api key") && msg.includes("not set"))) {
      return NextResponse.json(
        {
          success: false,
          error: "Image generation not configured",
          message: "Add OPENAI_API_KEY to .env.local to enable cover image generation.",
        },
        { status: 503 }
      );
    }
    if (msg.includes("content policy") || msg.includes("safety") || msg.includes("inappropriate")) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt rejected",
          message: "The image prompt was rejected. Try a different topic or description.",
        },
        { status: 400 }
      );
    }
    if (msg.includes("rate limit") || msg.includes("quota")) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit",
          message: "Image generation limit reached. Please try again later.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate image",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
