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
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: result.error.format(),
        },
        { status: 400 }
      );
    }
    
    const { prompt, size, quality } = result.data;
    
    // Additional validation for prompt content
    if (!validatePrompt(prompt)) {
      return NextResponse.json(
        {
          success: false,
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
  } catch (error: any) {
    console.error("Error in image generation:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
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
