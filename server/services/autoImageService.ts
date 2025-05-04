import { generateImage } from "./imageGenerationService";

/**
 * Generates an appropriate image for a blog post based on its title and content
 * @param title The blog post title
 * @param content The blog post content
 * @param tags Optional tags to help with image context
 * @returns URL of the generated image
 */
export async function generateBlogPostImage(
  title: string,
  content: string, 
  tags?: string[]
): Promise<string> {
  try {
    // Create a prompt that captures the essence of the blog post
    let prompt = `Create a professional image for a blog post titled "${title}".`;
    
    // Add context from tags if available
    if (tags && tags.length > 0) {
      prompt += ` The post is about ${tags.join(', ')}.`;
    }
    
    // Add brief content summary if available
    if (content && content.length > 0) {
      // Extract first paragraph or a portion of content to give context
      const contentSummary = content.substring(0, 300).replace(/\n/g, ' ');
      prompt += ` The post begins with: "${contentSummary}..."`;
    }
    
    // Generate the image with DALL-E 3
    const result = await generateImage(
      prompt, 
      "1024x1024", // Standard blog image size
      "standard"   // Standard quality to manage costs
    );
    
    // Return the URL of the generated image
    return result.url;
  } catch (error) {
    console.error("Error generating automatic blog image:", error);
    throw new Error(`Failed to generate blog cover image: ${error}`);
  }
}

/**
 * Generates an appropriate image for a project based on its details
 * @param title The project title
 * @param description The project description
 * @param category The project category
 * @param tags Optional tags to provide context
 * @returns URL of the generated image
 */
export async function generateProjectImage(
  title: string,
  description: string,
  category: string,
  tags?: string[]
): Promise<string> {
  try {
    // Create a prompt specific to the project
    let prompt = `Create a professional image for a software project called "${title}".`;
    
    // Add project category for context
    prompt += ` It's a ${category} project.`;
    
    // Add description summary
    if (description && description.length > 0) {
      const descriptionSummary = description.substring(0, 250).replace(/\n/g, ' ');
      prompt += ` Project description: "${descriptionSummary}..."`;
    }
    
    // Add context from tags
    if (tags && tags.length > 0) {
      prompt += ` Technologies used: ${tags.join(', ')}.`;
    }
    
    // Generate the image with DALL-E 3
    const result = await generateImage(
      prompt,
      "1024x1024", // Standard project image size
      "standard"   // Standard quality to manage costs
    );
    
    // Return the URL of the generated image
    return result.url;
  } catch (error) {
    console.error("Error generating automatic project image:", error);
    throw new Error(`Failed to generate project image: ${error}`);
  }
}