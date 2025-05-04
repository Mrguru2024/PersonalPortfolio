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
  blogPostContributions
} from "@shared/schema";
import { z } from "zod";

export const blogController = {
  // Get all published blog posts
  getBlogPosts: async (_req: Request, res: Response) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
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
        return res.status(403).json({ error: "This post is not published yet" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  },
  
  // Create a new blog post (requires authentication)
  createBlogPost: async (req: Request, res: Response) => {
    try {
      // For simplicity, assuming user authentication would be added later
      // and we would get the authorId from the authenticated session
      const authorId = 1; // This would come from authenticated user session
      
      const validatedData = insertBlogPostSchema.parse(req.body);
      const now = new Date();
      
      const post = await storage.createBlogPost({
        ...validatedData,
        publishedAt: now,
        updatedAt: now
      }, authorId);
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid blog post data", 
          details: error.errors 
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
      const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
      
      // Create comment
      const comment = await storage.createComment({
        postId,
        name: validatedData.name,
        email: validatedData.email,
        content: validatedData.content,
        createdAt: new Date(),
        captchaToken: validatedData.captchaToken
      }, ipAddress);
      
      res.status(201).json({ 
        ...comment,
        message: "Your comment has been submitted and is awaiting moderation"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid comment data", 
          details: error.errors 
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
      const postId = req.params.postId ? parseInt(req.params.postId) : undefined;
      
      // If postId is provided, get all comments for that post, otherwise get all comments
      const comments = postId 
        ? await storage.getCommentsByPostId(postId)
        : await db.select().from(blogComments).where(eq(blogComments.isApproved, false)).orderBy(desc(blogComments.createdAt));
        
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
      const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
      
      // Create contribution
      const contribution = await storage.createBlogPostContribution({
        title: validatedData.title,
        summary: validatedData.summary,
        content: validatedData.content,
        coverImage: validatedData.coverImage,
        tags: validatedData.tags,
        authorName: validatedData.authorName,
        authorEmail: validatedData.authorEmail
      }, ipAddress);
      
      res.status(201).json({ 
        ...contribution,
        message: "Your blog post contribution has been submitted and is awaiting review" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid blog post contribution data", 
          details: error.errors 
        });
      }
      
      console.error("Error submitting blog post contribution:", error);
      res.status(500).json({ error: "Failed to submit blog post contribution" });
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
      res.status(500).json({ error: "Failed to fetch pending blog post contributions" });
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
      
      if (typeof approve !== 'boolean') {
        return res.status(400).json({ error: "Approval status is required" });
      }
      
      const contribution = await storage.reviewBlogPostContribution(contributionId, approve, notes);
      
      // If approved, create a new blog post from the contribution
      if (approve) {
        const authorId = 1; // This would come from authenticated user session
        const now = new Date();
        
        // Create slug from title
        const slug = contribution.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-');
          
        await storage.createBlogPost({
          title: contribution.title,
          slug,
          summary: contribution.summary,
          content: contribution.content,
          coverImage: contribution.coverImage,
          tags: contribution.tags,
          publishedAt: now,
          updatedAt: now
        }, authorId);
      }
      
      res.json({ 
        message: approve ? "Contribution approved and published" : "Contribution rejected", 
        contribution 
      });
    } catch (error) {
      console.error("Error reviewing blog post contribution:", error);
      res.status(500).json({ error: "Failed to review blog post contribution" });
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
      
      const contribution = await storage.markBlogPostContributionAsSpam(contributionId);
      res.json({ message: "Contribution marked as spam", contribution });
    } catch (error) {
      console.error("Error marking contribution as spam:", error);
      res.status(500).json({ error: "Failed to mark contribution as spam" });
    }
  }
};