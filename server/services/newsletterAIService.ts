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
 * Generate newsletter subject line suggestions using AI
 */
export async function generateSubjectLines(topic: string, tone: "professional" | "casual" | "friendly" | "urgent" = "professional"): Promise<string[]> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email marketing copywriter. Generate compelling, engaging subject lines that increase open rates. Return only the subject lines, one per line, without numbering or bullets."
        },
        {
          role: "user",
          content: `Generate 5 email subject line suggestions for a newsletter about: "${topic}". Tone: ${tone}. Make them concise (under 50 characters), attention-grabbing, and relevant.`
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
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
    
    return lines.length > 0 ? lines : [`Newsletter: ${topic}`];
  } catch (error: any) {
    console.error("Error generating subject lines:", error);
    throw new Error("Failed to generate subject lines. Please try again.");
  }
}

/**
 * Generate newsletter preview text using AI
 */
export async function generatePreviewText(subject: string, content: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email marketing copywriter. Generate compelling preview text (preheader) that complements the subject line and entices readers to open the email. Keep it under 100 characters."
        },
        {
          role: "user",
          content: `Subject: "${subject}"\n\nContent preview: "${content.substring(0, 500)}"\n\nGenerate a compelling preview text that complements the subject line and encourages opens.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const previewText = response.choices[0]?.message?.content?.trim() || "";
    return previewText.substring(0, 100); // Ensure it's under 100 chars
  } catch (error: any) {
    console.error("Error generating preview text:", error);
    throw new Error("Failed to generate preview text. Please try again.");
  }
}

/**
 * Generate newsletter content using AI
 */
export async function generateNewsletterContent(
  topic: string,
  length: "short" | "medium" | "long" = "medium",
  tone: "professional" | "casual" | "friendly" = "professional"
): Promise<string> {
  try {
    const client = getOpenAIClient();
    
    const lengthGuidance = {
      short: "2-3 paragraphs, approximately 200-300 words",
      medium: "4-6 paragraphs, approximately 400-600 words",
      long: "8-10 paragraphs, approximately 800-1000 words"
    };

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert newsletter writer. Generate engaging, well-structured newsletter content in HTML format. Use proper HTML tags like <h2>, <p>, <ul>, <li>, <strong>, <em>, and <a>. Make it professional, informative, and engaging."
        },
        {
          role: "user",
          content: `Write a ${tone} newsletter about: "${topic}". Length: ${lengthGuidance[length]}. Format the response as HTML with proper structure, headings, and paragraphs. Include engaging content that would be valuable to readers.`
        }
      ],
      temperature: 0.7,
      max_tokens: (() => {
        if (length === "short") return 500;
        if (length === "medium") return 1000;
        return 2000;
      })(),
    });

    const content = response.choices[0]?.message?.content || "";
    return content.trim();
  } catch (error: any) {
    console.error("Error generating newsletter content:", error);
    throw new Error("Failed to generate newsletter content. Please try again.");
  }
}

/**
 * Expand or improve existing newsletter content using AI
 */
export async function improveNewsletterContent(
  content: string,
  instruction: "expand" | "improve" | "summarize" | "make-more-engaging" = "improve"
): Promise<string> {
  try {
    const client = getOpenAIClient();
    
    const instructions = {
      expand: "Expand this content with more details, examples, and valuable information while maintaining the original tone and style.",
      improve: "Improve this content by enhancing clarity, engagement, and readability while maintaining the original message and tone.",
      summarize: "Create a concise summary of this content, keeping only the most important points.",
      "make-more-engaging": "Make this content more engaging and compelling while keeping the core message intact. Add storytelling elements, questions, or calls to action where appropriate."
    };

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert newsletter editor. Improve newsletter content while maintaining HTML formatting. Preserve all HTML tags and structure."
        },
        {
          role: "user",
          content: `${instructions[instruction]}\n\nContent:\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const improvedContent = response.choices[0]?.message?.content || "";
    return improvedContent.trim();
  } catch (error: any) {
    console.error("Error improving newsletter content:", error);
    throw new Error("Failed to improve newsletter content. Please try again.");
  }
}

/**
 * Convert HTML content to plain text for email clients
 */
export async function htmlToPlainText(html: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Convert HTML content to clean, readable plain text. Preserve the structure with line breaks and formatting, but remove all HTML tags. Make it email-friendly."
        },
        {
          role: "user",
          content: `Convert this HTML to plain text:\n\n${html}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const plainText = response.choices[0]?.message?.content || "";
    return plainText.trim();
  } catch (error: any) {
    console.error("Error converting HTML to plain text:", error);
    // Fallback to basic HTML stripping
    if (typeof document !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText;
      return text || "";
    }
    // Server-side fallback
    const withoutTags = html.replaceAll(/<[^>]*>/g, "");
    const normalized = withoutTags.replaceAll(/\s+/g, " ");
    return normalized.trim();
  }
}
