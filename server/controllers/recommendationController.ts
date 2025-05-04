import { Request, Response } from "express";
import { z } from "zod";
import { getRecommendedProjects, generateRecommendationExplanation, RecommendationCriteria } from "../services/recommendationService";

// Zod schema for validating recommendation requests
const recommendationRequestSchema = z.object({
  interests: z.array(z.string()).min(1, "At least one interest is required"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  preferredTechnologies: z.array(z.string()).optional(),
  purpose: z.string().optional(),
  searchQuery: z.string().optional(),
  maxResults: z.number().int().positive().default(3).optional(),
});

type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;

export const recommendationController = {
  /**
   * Get personalized project recommendations based on user interests and preferences
   * Route: POST /api/recommendations
   */
  async getRecommendations(req: Request, res: Response) {
    try {
      // Validate the request body
      const validationResult = recommendationRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request parameters",
          details: validationResult.error.format(),
        });
      }
      
      const criteria: RecommendationCriteria = {
        interests: validationResult.data.interests,
        experienceLevel: validationResult.data.experienceLevel,
        preferredTechnologies: validationResult.data.preferredTechnologies,
        purpose: validationResult.data.purpose,
        searchQuery: validationResult.data.searchQuery,
      };
      
      const maxResults = validationResult.data.maxResults || 3;
      
      // Get recommendations
      const recommendations = await getRecommendedProjects(criteria, maxResults);
      
      // Generate explanation text
      const explanation = await generateRecommendationExplanation(recommendations, criteria);
      
      return res.status(200).json({
        success: true,
        data: {
          recommendations,
          explanation
        }
      });
    } catch (error: unknown) {
      console.error("Error in recommendation controller:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate recommendations",
        message: errorMessage,
      });
    }
  }
};