import { Request, Response } from "express";
import { storage } from "../storage";
import { insertBlogCommentSchema, insertBlogPostSchema, blogCommentFormSchema } from "@shared/schema";
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
      
      // Create comment
      const comment = await storage.createComment({
        postId,
        name: validatedData.name,
        email: validatedData.email,
        content: validatedData.content,
        createdAt: new Date()
      });
      
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
  }
};