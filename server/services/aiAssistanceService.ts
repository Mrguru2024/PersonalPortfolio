// AI Assistance Service for Project Assessment
// Uses OpenAI for accurate, contextual help with fallbacks when not configured

import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

/** Ensure we return a string array from model output (accurate, no hallucinated items). */
function parseStringList(raw: string, maxItems: number = 6): string[] {
  const lines = raw
    .split(/\n|\r/)
    .map((line) => line.replace(/^[\s\-*\d.)]+/, "").trim())
    .filter((line) => line.length > 0 && line.length < 200);
  return [...new Set(lines)].slice(0, maxItems);
}

/** Ensure single text block is safe and bounded. */
function sanitizeText(raw: string, maxLen: number = 2000): string {
  const t = raw.trim().slice(0, maxLen);
  return t;
}

export class AIAssistanceService {
  private get isConfigured(): boolean {
    return !!getOpenAIClient();
  }

  async generateIdeas(context: string, projectType?: string): Promise<string[]> {
    const client = getOpenAIClient();
    if (!client) return this.getFallbackIdeas(projectType);

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.35,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "You are a project planning assistant. Based only on the user's project description and type, suggest 3–5 concrete, actionable project ideas or focus areas. Be accurate and specific. Output one idea per line, no numbering or bullets. Do not invent features or requirements not implied by the context.",
          },
          {
            role: "user",
            content: `Project type: ${projectType || "not specified"}. Description: ${context.slice(0, 800)}. Suggest 3–5 concrete project ideas or focus areas based only on this. One per line.`,
          },
        ],
      });
      const raw = response.choices[0]?.message?.content || "";
      const list = parseStringList(raw, 5);
      return list.length > 0 ? list : this.getFallbackIdeas(projectType);
    } catch (error) {
      console.error("AI generateIdeas error:", error);
      return this.getFallbackIdeas(projectType);
    }
  }

  async suggestFeatures(projectType: string, currentFeatures: string[] = []): Promise<string[]> {
    const client = getOpenAIClient();
    const knownTypes = ["website", "web-app", "mobile-app", "ecommerce", "saas", "api", "other"];
    const safeType = knownTypes.includes(projectType) ? projectType : "website";

    if (!client) {
      const suggestions = this.getFallbackFeatureSuggestions(safeType);
      return suggestions.filter((f) => !currentFeatures.includes(f));
    }

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content:
              "You are a technical requirements assistant. Suggest only standard, realistic software features for the given project type. Output one feature per line, no numbering. Do not invent obscure or non-standard features. 4–6 suggestions only.",
          },
          {
            role: "user",
            content: `Project type: ${safeType}. Already selected: ${currentFeatures.join(", ") || "none"}. Suggest 4–6 additional must-have features that fit this project type. One per line, exclude already selected.`,
          },
        ],
      });
      const raw = response.choices[0]?.message?.content || "";
      const suggested = parseStringList(raw, 6).filter((f) => !currentFeatures.includes(f));
      const fallback = this.getFallbackFeatureSuggestions(safeType).filter((f) => !currentFeatures.includes(f));
      return suggested.length > 0 ? suggested : fallback;
    } catch (error) {
      console.error("AI suggestFeatures error:", error);
      return this.getFallbackFeatureSuggestions(safeType).filter((f) => !currentFeatures.includes(f));
    }
  }

  async improveDescription(description: string, projectType?: string): Promise<string> {
    const client = getOpenAIClient();
    if (!client || !description || description.length < 10) {
      return this.getFallbackImproveDescription(description);
    }

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.35,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "You are an editor for project descriptions. Improve the user's text for clarity and completeness only. Preserve their meaning and do not add fake details, features, or requirements. Output the improved description only, no preamble. Keep it professional and concise.",
          },
          {
            role: "user",
            content: `Project type: ${projectType || "general"}. Improve this description for clarity and completeness without adding invented details:\n\n${description.slice(0, 1500)}`,
          },
        ],
      });
      const raw = response.choices[0]?.message?.content || "";
      return sanitizeText(raw, 2000) || this.getFallbackImproveDescription(description);
    } catch (error) {
      console.error("AI improveDescription error:", error);
      return this.getFallbackImproveDescription(description);
    }
  }

  async clarifyRequirements(question: string, context: Record<string, unknown>): Promise<string[]> {
    const client = getOpenAIClient();
    if (!client) return this.getFallbackClarifyRequirements(context);

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are a requirements-gathering assistant. Based only on what the user has already provided, suggest 2–4 short clarifying questions to fill gaps. Output one question per line, no numbering. Be specific and relevant. Do not ask about things already stated.",
          },
          {
            role: "user",
            content: `Current context (do not repeat these): ${JSON.stringify(context).slice(0, 600)}. Suggest 2–4 short clarifying questions. One per line.`,
          },
        ],
      });
      const raw = response.choices[0]?.message?.content || "";
      const list = parseStringList(raw, 4);
      return list.length > 0 ? list : this.getFallbackClarifyRequirements(context);
    } catch (error) {
      console.error("AI clarifyRequirements error:", error);
      return this.getFallbackClarifyRequirements(context);
    }
  }

  /** AI grading: score 0–100 and structured feedback for assessment quality/readiness. */
  async gradeAssessment(assessmentData: Record<string, unknown>): Promise<{
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  }> {
    const client = getOpenAIClient();
    const fallback = {
      score: 50,
      summary: "Assessment received. Review the breakdown and reach out to discuss.",
      strengths: [] as string[],
      improvements: [] as string[],
    };

    if (!client) return fallback;

    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.25,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: `You are an expert at evaluating project assessment forms for completeness and clarity. Respond with valid JSON only, no markdown or code fences:
{
  "score": <number 0-100>,
  "summary": "<one short paragraph>",
  "strengths": ["<item1>", "<item2>"],
  "improvements": ["<item1>", "<item2>"]
}
Score based on: clarity of description, target audience, goals, and requirements. Be accurate; do not invent details. strengths and improvements must be 2–4 items each, brief.`,
          },
          {
            role: "user",
            content: `Evaluate this assessment (respond with JSON only):\n${JSON.stringify(assessmentData).slice(0, 2500)}`,
          },
        ],
      });
      const raw = response.choices[0]?.message?.content || "";
      const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(cleaned) as { score?: number; summary?: string; strengths?: string[]; improvements?: string[] };
      const score = Math.min(100, Math.max(0, Number(parsed.score) || 50));
      const summary = typeof parsed.summary === "string" ? sanitizeText(parsed.summary, 500) : fallback.summary;
      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4).map(String) : [];
      const improvements = Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 4).map(String) : [];
      return { score, summary, strengths, improvements };
    } catch (error) {
      console.error("AI gradeAssessment error:", error);
      return fallback;
    }
  }

  private getFallbackIdeas(projectType?: string): string[] {
    const ideas: Record<string, string[]> = {
      website: [
        "Create a modern, responsive design that works on all devices",
        "Include a blog section to share updates and improve SEO",
        "Add a contact form with automated email notifications",
      ],
      "web-app": [
        "Build a user-friendly dashboard for data visualization",
        "Implement secure user authentication and authorization",
        "Add an admin panel for content management",
      ],
      "mobile-app": [
        "Design an intuitive mobile-first user interface",
        "Implement push notifications for user engagement",
        "Add offline functionality for better user experience",
      ],
      ecommerce: [
        "Create a seamless shopping experience with easy checkout",
        "Implement product search and filtering capabilities",
        "Add customer reviews and ratings for social proof",
      ],
    };
    return ideas[projectType as keyof typeof ideas] || [
      "Focus on user experience and intuitive navigation",
      "Ensure the design is responsive and accessible",
      "Plan for scalability and future growth",
    ];
  }

  private getFallbackFeatureSuggestions(projectType: string): string[] {
    const featureSuggestions: Record<string, string[]> = {
      website: ["Contact form", "Blog/News section", "SEO optimization", "Analytics integration", "Newsletter signup"],
      "web-app": ["User dashboard", "Search functionality", "Admin panel", "User roles & permissions", "Notifications"],
      "mobile-app": ["Push notifications", "Offline mode", "Location services", "Camera integration", "Analytics tracking"],
      ecommerce: ["Product catalog", "Shopping cart", "Payment gateway", "Order management", "Customer reviews"],
      saas: ["Subscription management", "Billing system", "User onboarding", "Usage analytics", "Team collaboration"],
    };
    return featureSuggestions[projectType] || featureSuggestions.website;
  }

  private getFallbackImproveDescription(description: string): string {
    let improved = description.trim();
    if (improved.length > 0) improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    if (improved.length > 0 && !/\.|!|\?$/.test(improved)) improved += ".";
    if (improved.length < 50) improved += " Consider adding more details about your target users, key features, and business goals.";
    return improved;
  }

  private getFallbackClarifyRequirements(context: Record<string, unknown>): string[] {
    const questions: string[] = [];
    if (!context.projectType) questions.push("What type of project are you building? (website, web app, mobile app, etc.)");
    if (!context.targetAudience) questions.push("Who is your target audience?");
    if (!context.mainGoals || (Array.isArray(context.mainGoals) && context.mainGoals.length === 0)) questions.push("What are your main business goals for this project?");
    if (!context.budgetRange) questions.push("What is your budget range for this project?");
    return questions.slice(0, 3);
  }

  async generateProjectSuggestions(assessment: {
    projectType: string;
    projectName: string;
    projectDescription: string;
    mustHaveFeatures?: string[];
    platform?: string[];
    dataStorage?: string;
    userAuthentication?: string;
    primaryBusinessGoal?: string;
    revenueModel?: string;
    expectedUsers?: string;
  }): Promise<string> {
    const projectType = assessment.projectType;
    const features = await this.suggestFeatures(projectType, assessment.mustHaveFeatures || []);

    let suggestions = `PROJECT SUGGESTIONS FOR: ${assessment.projectName}\n`;
    suggestions += `PROJECT TYPE: ${projectType.toUpperCase()}\n\n`;
    suggestions += `DESCRIPTION:\n${assessment.projectDescription}\n\n`;
    suggestions += `RECOMMENDED FEATURES:\n`;
    features.forEach((f, i) => { suggestions += `${i + 1}. ${f}\n`; });
    suggestions += `\nTECHNICAL RECOMMENDATIONS:\n`;
    if (assessment.platform?.length) suggestions += `• Platforms: ${assessment.platform.join(", ")}\n`;
    if (assessment.dataStorage) suggestions += `• Data Storage: ${assessment.dataStorage}\n`;
    if (assessment.userAuthentication) suggestions += `• Authentication: ${assessment.userAuthentication}\n`;
    if (assessment.primaryBusinessGoal) suggestions += `• Primary Goal: ${assessment.primaryBusinessGoal}\n`;
    if (assessment.revenueModel) suggestions += `• Revenue Model: ${assessment.revenueModel}\n`;
    return suggestions;
  }
}

export const aiAssistanceService = new AIAssistanceService();
