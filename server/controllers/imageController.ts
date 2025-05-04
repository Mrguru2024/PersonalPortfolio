import { Request, Response } from "express";
import { generateImage, validatePrompt } from "../services/imageGenerationService";
import { z } from "zod";

// Schema for image generation requests
const generateImageSchema = z.object({
  prompt: z.string().min(10).max(1000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard"),
});

export const imageController = {
  /**
   * Generate an image using OpenAI's DALL-E model
   * Route: POST /api/images/generate
   * Restricted to authenticated users to prevent abuse
   */
  async generateImage(req: Request, res: Response) {
    try {
      // Validate request body against schema
      const result = generateImageSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request parameters",
          details: result.error.format(),
        });
      }
      
      const { prompt, size, quality } = result.data;
      
      // Additional validation for prompt content
      if (!validatePrompt(prompt)) {
        return res.status(400).json({
          success: false,
          error: "Invalid prompt content",
        });
      }
      
      // Generate the image
      const image = await generateImage(prompt, size, quality);
      
      // Return the generated image information
      return res.status(200).json({
        success: true,
        data: image,
      });
    } catch (error: unknown) {
      console.error("Error in image generation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate image",
        message: errorMessage,
      });
    }
  },
};