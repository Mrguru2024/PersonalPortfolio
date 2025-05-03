// Import from actual shared schema, keeping types consistent
import {
  insertContactSchema as baseContactSchema,
  insertResumeRequestSchema as baseResumeRequestSchema,
  Project,
  Skill,
  BlogPost,
  User,
  InsertUser,
  InsertProject,
  InsertSkill,
  InsertContact,
  InsertResumeRequest,
  InsertBlogPost,
  InsertBlogComment,
  InsertBlogPostContribution,
  BlogComment,
  BlogPostContribution
} from "@shared/schema";

// Re-export these types
export type {
  Project,
  Skill,
  BlogPost,
  User,
  InsertUser,
  InsertProject,
  InsertSkill,
  InsertContact,
  InsertResumeRequest,
  InsertBlogPost,
  InsertBlogComment,
  InsertBlogPostContribution,
  BlogComment,
  BlogPostContribution
};

// Re-export validation schemas with potential modifications for frontend usage
import { z } from "zod";

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

// Resume request form schema
export const resumeRequestFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  reason: z.string().min(10, "Please provide a reason with at least 10 characters").max(500),
});

// Blog comment form schema
export const blogCommentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  content: z.string().min(5, "Comment must be at least 5 characters").max(1000),
  website: z.string().optional(),
});

// Blog post contribution form schema
export const blogPostContributionFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(100, "Content must be at least 100 characters"),
  summary: z.string().min(20, "Summary must be at least 20 characters").max(300),
});