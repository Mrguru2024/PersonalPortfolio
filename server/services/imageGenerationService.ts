import OpenAI from "openai";

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

/**
 * Generates an image using OpenAI's DALL-E 3 model
 * @param prompt Text description of the image to generate
 * @param size Size of the generated image ('1024x1024', '1024x1792', or '1792x1024')
 * @param quality Image quality ('standard' or 'hd')
 * @returns Generated image information including URL
 */
export async function generateImage(
  prompt: string,
  size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024",
  quality: "standard" | "hd" = "standard"
): Promise<GeneratedImage> {
  try {
    // Enhance the prompt with professional quality directions
    const enhancedPrompt = `Create a high-quality, professional image for a developer portfolio: ${prompt}. Make it visually striking with detailed textures, good lighting, and an appealing color scheme. Style: modern, digital, professional.`;

    // Generate the image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "dall-e-3" which was released after gpt-4's knowledge cutoff
      prompt: enhancedPrompt,
      n: 1,
      size: size,
      quality: quality,
      style: "natural", // Use natural style for more realistic images
    });

    // Make sure we have data before using it
    if (!response.data || response.data.length === 0 || !response.data[0].url) {
      throw new Error("No image was generated");
    }

    // Return the generated image data
    return {
      url: response.data[0].url || "",
      prompt: prompt,
      timestamp: Date.now(),
    };
  } catch (error: unknown) {
    console.error("Error generating image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate image: ${errorMessage}`);
  }
}

/**
 * Validates prompt text to ensure it meets safety and quality standards
 * @param prompt Text prompt to validate
 * @returns Boolean indicating if the prompt is valid
 */
export function validatePrompt(prompt: string): boolean {
  // Basic validation
  if (!prompt || prompt.trim().length < 10) {
    return false;
  }

  // Check for prompt length (DALL-E has token limits)
  if (prompt.length > 1000) {
    return false;
  }

  return true;
}