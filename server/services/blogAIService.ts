import OpenAI from "openai";

// Lazy initialization of OpenAI client - only create when actually needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set. AI features are disabled.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Generate blog post title suggestions using AI
 */
export async function generateBlogTitles(topic: string, style: "professional" | "casual" | "engaging" | "seo-optimized" = "professional"): Promise<string[]> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert blog writer and SEO specialist. Generate compelling, engaging blog post titles that are optimized for both readers and search engines. Return only the titles, one per line, without numbering or bullets."
        },
        {
          role: "user",
          content: `Generate 5 blog post title suggestions for a post about: "${topic}". Style: ${style}. Make them attention-grabbing, clear, and optimized for SEO. Keep titles between 50-70 characters for best SEO performance.`
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    const lines = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => {
        if (line.length === 0) return false;
        const numberedListPattern = /^\d+[.)]/;
        return !numberedListPattern.test(line);
      })
      .slice(0, 5);
    
    return lines.length > 0 ? lines : [`Blog Post: ${topic}`];
  } catch (error: any) {
    console.error("Error generating blog titles:", error);
    throw new Error("Failed to generate blog titles. Please try again.");
  }
}

/**
 * Generate blog post summary using AI
 */
export async function generateBlogSummary(title: string, content: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert blog writer. Generate compelling, concise blog post summaries (meta descriptions) that entice readers to click and read the full post. Keep summaries between 150-160 characters for optimal SEO and social sharing."
        },
        {
          role: "user",
          content: `Title: "${title}"\n\nContent preview: "${content.substring(0, 1000)}"\n\nGenerate a compelling summary that captures the essence of this blog post and encourages readers to click.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content?.trim() || "";
    return summary.substring(0, 160); // Ensure it's under 160 chars for SEO
  } catch (error: any) {
    console.error("Error generating blog summary:", error);
    throw new Error("Failed to generate blog summary. Please try again.");
  }
}

/**
 * Generate blog post content using AI
 */
export async function generateBlogContent(
  topic: string,
  length: "short" | "medium" | "long" = "medium",
  style: "professional" | "casual" | "technical" | "storytelling" = "professional"
): Promise<string> {
  try {
    const client = getOpenAIClient();
    
    const lengthGuidance = {
      short: "800-1200 words, 3-4 sections",
      medium: "1500-2000 words, 5-7 sections with headings",
      long: "2500-3500 words, 8-10 sections with detailed explanations"
    };

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert blog writer. Generate engaging, well-structured blog post content in HTML format. Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>, and <a>. Make it professional, informative, and engaging with proper headings hierarchy for SEO."
        },
        {
          role: "user",
          content: `Write a ${style} blog post about: "${topic}". Length: ${lengthGuidance[length]}. Format the response as HTML with proper structure, headings (h2, h3), paragraphs, lists, and formatting. Include an introduction, main content sections, and a conclusion. Make it SEO-friendly with proper heading hierarchy.`
        }
      ],
      temperature: 0.7,
      max_tokens: (() => {
        if (length === "short") return 2000;
        if (length === "medium") return 3000;
        return 4000;
      })(),
    });

    const content = response.choices[0]?.message?.content || "";
    return content.trim();
  } catch (error: any) {
    console.error("Error generating blog content:", error);
    throw new Error("Failed to generate blog content. Please try again.");
  }
}

/**
 * Improve or expand existing blog content using AI
 */
export async function improveBlogContent(
  content: string,
  instruction: "expand" | "improve" | "summarize" | "make-more-engaging" | "add-seo" = "improve"
): Promise<string> {
  try {
    const client = getOpenAIClient();
    
    const instructions = {
      expand: "Expand this blog post content with more details, examples, case studies, and valuable information while maintaining the original tone and style. Add more depth to each section.",
      improve: "Improve this blog post content by enhancing clarity, engagement, readability, and flow while maintaining the original message and tone. Fix any grammar or style issues.",
      summarize: "Create a concise summary of this blog post content, keeping only the most important points and key takeaways.",
      "make-more-engaging": "Make this blog post content more engaging and compelling while keeping the core message intact. Add storytelling elements, questions, examples, or calls to action where appropriate.",
      "add-seo": "Optimize this blog post content for SEO by improving heading structure, adding relevant keywords naturally, improving readability, and ensuring proper HTML formatting for search engines."
    };

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert blog editor and SEO specialist. Improve blog post content while maintaining HTML formatting. Preserve all HTML tags and structure."
        },
        {
          role: "user",
          content: `${instructions[instruction]}\n\nContent:\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const improvedContent = response.choices[0]?.message?.content || "";
    return improvedContent.trim();
  } catch (error: any) {
    console.error("Error improving blog content:", error);
    throw new Error("Failed to improve blog content. Please try again.");
  }
}

/**
 * Generate SEO meta tags for blog post
 */
export async function generateSEOMeta(
  title: string,
  content: string
): Promise<{
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
}> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Generate optimized meta tags for blog posts. Return a JSON object with: metaTitle (50-60 chars), metaDescription (150-160 chars), keywords (array of 5-10 relevant keywords), ogTitle (60-70 chars), ogDescription (150-160 chars)."
        },
        {
          role: "user",
          content: `Title: "${title}"\n\nContent: "${content.substring(0, 2000)}"\n\nGenerate SEO-optimized meta tags for this blog post. Return only valid JSON.`
        }
      ],
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const jsonContent = response.choices[0]?.message?.content || "{}";
    const meta = JSON.parse(jsonContent);
    
    return {
      metaTitle: meta.metaTitle || title.substring(0, 60),
      metaDescription: meta.metaDescription || content.substring(0, 160).replace(/<[^>]*>/g, ""),
      keywords: Array.isArray(meta.keywords) ? meta.keywords : (meta.keywords ? [meta.keywords] : []),
      ogTitle: meta.ogTitle || title.substring(0, 70),
      ogDescription: meta.ogDescription || meta.metaDescription || content.substring(0, 160).replace(/<[^>]*>/g, ""),
    };
  } catch (error: any) {
    console.error("Error generating SEO meta:", error);
    // Fallback to basic generation
    const textContent = content.replace(/<[^>]*>/g, "").substring(0, 160);
    return {
      metaTitle: title.substring(0, 60),
      metaDescription: textContent,
      keywords: [],
      ogTitle: title.substring(0, 70),
      ogDescription: textContent,
    };
  }
}

/**
 * Generate relevant tags for blog post
 */
export async function generateBlogTags(title: string, content: string): Promise<string[]> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist. Generate relevant, SEO-friendly tags for blog posts. Return only the tags, comma-separated, without numbering or bullets."
        },
        {
          role: "user",
          content: `Title: "${title}"\n\nContent: "${content.substring(0, 1500)}"\n\nGenerate 5-8 relevant, SEO-friendly tags for this blog post. Return them as a comma-separated list.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const content_text = response.choices[0]?.message?.content || "";
    const tags = content_text
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && !tag.match(/^\d+[.)]/))
      .slice(0, 8);
    
    return tags.length > 0 ? tags : [];
  } catch (error: any) {
    console.error("Error generating blog tags:", error);
    throw new Error("Failed to generate blog tags. Please try again.");
  }
}

/**
 * Generate cover image prompt for blog post
 */
export async function generateImagePrompt(title: string, content: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating image generation prompts. Generate a detailed, descriptive prompt for DALL-E 3 to create a professional blog post cover image. The prompt should be specific, visually descriptive, and suitable for a developer/tech blog."
        },
        {
          role: "user",
          content: `Blog Post Title: "${title}"\n\nContent: "${content.substring(0, 1000)}"\n\nGenerate a detailed image generation prompt for creating a professional, eye-catching cover image for this blog post. The image should be modern, clean, and relevant to the content.`
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const prompt = response.choices[0]?.message?.content?.trim() || "";
    return prompt || `Professional blog post cover image for: ${title}`;
  } catch (error: any) {
    console.error("Error generating image prompt:", error);
    return `Professional blog post cover image for: ${title}`;
  }
}
