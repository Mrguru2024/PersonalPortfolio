import { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import {
  insertBlogCommentSchema,
  insertBlogPostSchema,
  blogCommentFormSchema,
  blogPostContributionFormSchema,
  insertBlogPostContributionSchema,
  blogComments,
  blogPostContributions,
} from "@shared/schema";
import { z } from "zod";
import { generateBlogPostImage } from "../services/autoImageService";
import { emailService } from "../services/emailService";

export const blogController = {
  // Get all published blog posts
  getBlogPosts: async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);

      // Check if it's a database connection error
      const errorMessage = (error?.message || String(error)).toLowerCase();
      if (
        errorMessage.includes("endpoint has been disabled") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("econnrefused") ||
        errorMessage.includes("econnreset") ||
        errorMessage.includes("enotfound") ||
        errorMessage.includes("reset")
      ) {
        console.warn(
          "Database unavailable, returning empty array for blog posts"
        );
        return res.json([]);
      }

      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  },

  // Get single blog post by slug
  getBlogPostBySlug: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);

      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      if (!post.isPublished) {
        return res
          .status(403)
          .json({ error: "This post is not published yet" });
      }

      res.json(post);
    } catch (error: any) {
      console.error("Error fetching blog post:", error);

      // Check if it's a database connection error
      const errorMessage = (error?.message || String(error)).toLowerCase();
      if (
        errorMessage.includes("endpoint has been disabled") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("econnrefused") ||
        errorMessage.includes("econnreset") ||
        errorMessage.includes("enotfound") ||
        errorMessage.includes("reset")
      ) {
        console.warn("Database unavailable, returning 404 for blog post");
        return res.status(404).json({ error: "Blog post not found" });
      }

      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  },

  // Create a new blog post (requires authentication)
  createBlogPost: async (req: Request, res: Response) => {
    try {
      // Get authorId from authenticated user session
      const authorId = req.user?.id || 1; // Fallback to 1 if no user (shouldn't happen with auth check)

      const validatedData = insertBlogPostSchema.parse(req.body);
      const now = new Date();

      // Check if a cover image was provided, if not, generate one using AI
      let coverImage = validatedData.coverImage;
      if (!coverImage || coverImage.trim() === "") {
        console.log(
          "No cover image provided for blog post, generating one with AI..."
        );
        try {
          // Generate an image based on the blog post content
          coverImage = await generateBlogPostImage(
            validatedData.title,
            validatedData.content,
            Array.isArray(validatedData.tags) ? validatedData.tags : []
          );
          console.log("Successfully generated AI cover image for blog post");
        } catch (imageError) {
          console.error("Failed to generate AI cover image:", imageError);
          coverImage = "/favicon.svg";
        }
      }

      const post = await storage.createBlogPost(
        {
          ...validatedData,
          coverImage, // Use the provided or AI-generated image
          publishedAt: now,
          updatedAt: now,
        },
        authorId
      );

      // Include info about image generation in the response
      const wasImageGenerated = validatedData.coverImage !== coverImage;

      res.status(201).json({
        ...post,
        imageGenerated: wasImageGenerated,
        message: wasImageGenerated
          ? "Cover image was automatically generated"
          : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid blog post data",
          details: error.errors,
        });
      }

      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Failed to create blog post" });
    }
  },

  // Get comments for a blog post
  getPostComments: async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);

      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const comments = await storage.getApprovedCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  },

  // Add a comment to a blog post
  addComment: async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);

      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      // Check if post exists
      const post = await storage.getBlogPostById(postId);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      // Validate comment data
      const validatedData = blogCommentFormSchema.parse(req.body);

      // Get IP address
      const ipAddress = req.ip || req.socket.remoteAddress || "0.0.0.0";

      // Create comment
      const comment = await storage.createComment(
        {
          postId,
          name: validatedData.name,
          email: validatedData.email,
          content: validatedData.content,
          createdAt: new Date(),
          captchaToken: validatedData.captchaToken,
        },
        ipAddress
      );

      // Send email notification for new blog comment
      await emailService.sendNotification({
        type: "contact",
        data: {
          name: validatedData.name,
          email: validatedData.email,
          subject: `New Comment on Blog Post: ${post.title}`,
          message: `A new comment has been submitted on your blog post "${post.title}":\n\n${validatedData.content}\n\nPost: ${post.slug}`,
        },
      });

      res.status(201).json({
        ...comment,
        message: "Your comment has been submitted and is awaiting moderation",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid comment data",
          details: error.errors,
        });
      }

      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  },

  // Get pending comments for moderation (admin only)
  getPendingComments: async (req: Request, res: Response) => {
    try {
      // This would be protected by admin authentication middleware
      const postId = req.params.postId
        ? parseInt(req.params.postId)
        : undefined;

      // If postId is provided, get all comments for that post, otherwise get all comments
      const comments = postId
        ? await storage.getCommentsByPostId(postId)
        : await db
            .select()
            .from(blogComments)
            .where(eq(blogComments.isApproved, false))
            .orderBy(desc(blogComments.createdAt));

      res.json(comments);
    } catch (error) {
      console.error("Error fetching pending comments:", error);
      res.status(500).json({ error: "Failed to fetch pending comments" });
    }
  },

  // Approve a comment (admin only)
  approveComment: async (req: Request, res: Response) => {
    try {
      // This would be protected by admin authentication middleware
      const commentId = parseInt(req.params.commentId);

      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      const comment = await storage.approveComment(commentId);
      res.json({ message: "Comment approved successfully", comment });
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ error: "Failed to approve comment" });
    }
  },

  // Mark a comment as spam (admin only)
  markCommentAsSpam: async (req: Request, res: Response) => {
    try {
      // This would be protected by admin authentication middleware
      const commentId = parseInt(req.params.commentId);

      if (isNaN(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      const comment = await storage.markCommentAsSpam(commentId);
      res.json({ message: "Comment marked as spam", comment });
    } catch (error) {
      console.error("Error marking comment as spam:", error);
      res.status(500).json({ error: "Failed to mark comment as spam" });
    }
  },

  // Submit a blog post contribution (public)
  submitBlogPostContribution: async (req: Request, res: Response) => {
    try {
      // Validate contribution data
      const validatedData = blogPostContributionFormSchema.parse(req.body);

      // Get IP address
      const ipAddress = req.ip || req.socket.remoteAddress || "0.0.0.0";

      // Check if a cover image was provided, if not, generate one using AI
      let coverImage = validatedData.coverImage;
      if (!coverImage || coverImage.trim() === "") {
        console.log(
          "No cover image provided for blog contribution, generating one with AI..."
        );
        try {
          // Generate an image based on the blog post content
          coverImage = await generateBlogPostImage(
            validatedData.title,
            validatedData.content,
            Array.isArray(validatedData.tags) ? validatedData.tags : []
          );
          console.log(
            "Successfully generated AI cover image for blog contribution"
          );
        } catch (imageError) {
          console.error("Failed to generate AI cover image:", imageError);
          coverImage = "/favicon.svg";
        }
      }

      // Create contribution
      const contribution = await storage.createBlogPostContribution(
        {
          title: validatedData.title,
          summary: validatedData.summary,
          content: validatedData.content,
          coverImage: coverImage, // Use the provided or AI-generated image
          tags: validatedData.tags,
          authorName: validatedData.authorName,
          authorEmail: validatedData.authorEmail,
        },
        ipAddress
      );

      // Include info about image generation in the response
      const wasImageGenerated = validatedData.coverImage !== coverImage;

      res.status(201).json({
        ...contribution,
        imageGenerated: wasImageGenerated,
        message: wasImageGenerated
          ? "Your blog post contribution has been submitted with an AI-generated cover image and is awaiting review"
          : "Your blog post contribution has been submitted and is awaiting review",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid blog post contribution data",
          details: error.errors,
        });
      }

      console.error("Error submitting blog post contribution:", error);
      res
        .status(500)
        .json({ error: "Failed to submit blog post contribution" });
    }
  },

  // Get pending blog post contributions (admin only)
  getPendingContributions: async (_req: Request, res: Response) => {
    try {
      // This would be protected by admin authentication middleware
      const contributions = await storage.getBlogPostContributions(false);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching pending blog post contributions:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch pending blog post contributions" });
    }
  },

  // Review a blog post contribution (admin only)
  reviewBlogPostContribution: async (req: Request, res: Response) => {
    try {
      // This would be protected by admin authentication middleware
      const contributionId = parseInt(req.params.contributionId);

      if (isNaN(contributionId)) {
        return res.status(400).json({ error: "Invalid contribution ID" });
      }

      const { approve, notes } = req.body;

      if (typeof approve !== "boolean") {
        return res.status(400).json({ error: "Approval status is required" });
      }

      const contribution = await storage.reviewBlogPostContribution(
        contributionId,
        approve,
        notes
      );

      // If approved, create a new blog post from the contribution
      if (approve) {
        const authorId = 1; // This would come from authenticated user session
        const now = new Date();

        // Create slug from title
        const slug = contribution.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");

        await storage.createBlogPost(
          {
            title: contribution.title,
            slug,
            summary: contribution.summary,
            content: contribution.content,
            coverImage: contribution.coverImage,
            tags: contribution.tags,
            publishedAt: now,
            updatedAt: now,
          },
          authorId
        );
      }

      res.json({
        message: approve
          ? "Contribution approved and published"
          : "Contribution rejected",
        contribution,
      });
    } catch (error) {
      console.error("Error reviewing blog post contribution:", error);
      res
        .status(500)
        .json({ error: "Failed to review blog post contribution" });
    }
  },

  // Mark a blog post contribution as spam (admin only)
  markContributionAsSpam: async (req: Request, res: Response) => {
    try {
      // This would be protected by admin authentication middleware
      const contributionId = parseInt(req.params.contributionId);

      if (isNaN(contributionId)) {
        return res.status(400).json({ error: "Invalid contribution ID" });
      }

      const contribution = await storage.markBlogPostContributionAsSpam(
        contributionId
      );
      res.json({ message: "Contribution marked as spam", contribution });
    } catch (error) {
      console.error("Error marking contribution as spam:", error);
      res.status(500).json({ error: "Failed to mark contribution as spam" });
    }
  },
};
