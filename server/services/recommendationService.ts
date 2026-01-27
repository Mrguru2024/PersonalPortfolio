import OpenAI from "openai";
import { Project } from "@shared/schema";
import { storage } from "../storage";

// Lazy initialization of OpenAI client - only create when actually needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set. Recommendations are disabled.");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Define interface for recommendation criteria
export interface RecommendationCriteria {
  interests: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredTechnologies?: string[];
  purpose?: string; // e.g., "learning", "hiring", "collaboration"
  searchQuery?: string;
}

/**
 * Get project recommendations using OpenAI's analysis
 * @param criteria Recommendation criteria including user interests and preferences
 * @param maxResults Maximum number of projects to recommend
 * @returns Array of recommended projects with relevance scores
 */
export async function getRecommendedProjects(
  criteria: RecommendationCriteria,
  maxResults: number = 3
): Promise<{project: Project, score: number, reason: string}[]> {
  try {
    // Step 1: Get all available projects
    const allProjects = await storage.getProjects();
    
    // If no projects available, return empty array
    if (!allProjects || allProjects.length === 0) {
      return [];
    }
    
    // Step 2: Prepare the prompt for OpenAI
    const projectsJson = JSON.stringify(allProjects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      tags: p.tags,
      category: p.category,
    })));
    
    const criteriaJson = JSON.stringify(criteria);
    
    const prompt = `
You are a project recommendation engine for a developer's portfolio website.
Given a list of projects and user preferences, recommend the most relevant projects for the user.

Available projects:
${projectsJson}

User preferences:
${criteriaJson}

Analyze the projects and provide recommendations based on the following:
1. Project tags matching user interests and preferredTechnologies
2. Project category and content relevance to user's purpose and experience level
3. Any specific search query provided by the user

For each recommended project, provide:
- The project ID
- A relevance score from 0-100
- A brief explanation of why this project was recommended

Return your response as a JSON array of objects with the structure:
[
  {
    "id": "project_id",
    "score": 85,
    "reason": "This project is recommended because..."
  }
]

Please recommend up to ${maxResults} projects, ranked by relevance score.
`;

    // Step 3: Get recommendations from OpenAI
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a project recommendation specialist that helps match users with relevant projects based on their interests." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5 // Lower temperature for more consistent, focused results
    });

    // Step 4: Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from recommendation engine");
    }
    
    // Parse the JSON response
    const recommendations = JSON.parse(content).map((rec: {id: string, score: number, reason: string}) => {
      // Find the full project details for each recommended project ID
      const project = allProjects.find(p => p.id === rec.id);
      
      if (!project) {
        throw new Error(`Project with ID ${rec.id} not found`);
      }
      
      return {
        project: project,
        score: rec.score,
        reason: rec.reason
      };
    });
    
    // Step 5: Return sorted recommendations
    return recommendations.sort((a: {score: number}, b: {score: number}) => b.score - a.score);
  } catch (error: unknown) {
    console.error("Error getting project recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get project recommendations: ${errorMessage}`);
  }
}

/**
 * Generate a natural language explanation of why these projects were recommended
 * @param recommendations The projects recommended for the user
 * @param criteria The user's criteria that led to these recommendations
 * @returns A natural language explanation of the recommendations
 */
export async function generateRecommendationExplanation(
  recommendations: {project: Project, score: number, reason: string}[],
  criteria: RecommendationCriteria
): Promise<string> {
  try {
    // Skip if no recommendations
    if (recommendations.length === 0) {
      return "No projects matched your preferences. Try broadening your interests or technology preferences.";
    }
    
    // Create a summary of the recommended projects
    const projectSummaries = recommendations.map(rec => 
      `${rec.project.title} (Relevance score: ${rec.score}): ${rec.reason}`
    ).join("\n\n");
    
    // Generate an explanation using OpenAI
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an AI career advisor who specializes in helping people understand why certain projects might be valuable to them based on their interests and needs." 
        },
        { 
          role: "user", 
          content: `
Based on the user's interests (${criteria.interests.join(", ")})${criteria.preferredTechnologies ? ` and preferred technologies (${criteria.preferredTechnologies.join(", ")})` : ""}, 
I've recommended the following projects:

${projectSummaries}

Please write a brief, friendly paragraph (max 3-4 sentences) explaining why these projects are relevant to their interests and what they might learn or gain from exploring them. Don't mention the relevance scores in your explanation. 
Focus on being encouraging and highlighting the value of the projects. 
Be concise and personable.
`
        }
      ],
      temperature: 0.7 // Higher temperature for a more conversational tone
    });

    return response.choices[0].message.content || "These projects align well with your interests and preferences.";
  } catch (error) {
    console.error("Error generating recommendation explanation:", error);
    return "These projects were selected based on your preferences and may provide valuable insights into the technologies and topics you're interested in.";
  }
}