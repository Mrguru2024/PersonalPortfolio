import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { portfolioController } from "./controllers/portfolioController";
import { blogController } from "./controllers/blogController";
import { uploadController } from "./controllers/uploadController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Portfolio API routes
  app.get('/api/projects', portfolioController.getProjects);
  app.get('/api/projects/:id', portfolioController.getProjectById);
  app.get('/api/skills', portfolioController.getSkills);
  app.get('/api/info', portfolioController.getPersonalInfo);
  app.get('/api/contact', portfolioController.getContactInfo);
  app.post('/api/contact', portfolioController.submitContactForm);
  app.get('/api/resume', portfolioController.downloadResume);
  
  // Blog API routes
  app.get('/api/blog', blogController.getBlogPosts);
  app.post('/api/blog', blogController.createBlogPost);
  app.get('/api/blog/post/:postId/comments', blogController.getPostComments);
  app.post('/api/blog/post/:postId/comments', blogController.addComment);
  app.get('/api/blog/:slug', blogController.getBlogPostBySlug);
  
  // Blog moderation routes (these would be protected with auth middleware in production)
  app.get('/api/blog/comments/pending', blogController.getPendingComments);
  app.get('/api/blog/comments/pending/:postId', blogController.getPendingComments);
  app.post('/api/blog/comments/:commentId/approve', blogController.approveComment);
  app.post('/api/blog/comments/:commentId/mark-spam', blogController.markCommentAsSpam);
  
  // Blog contribution routes
  app.post('/api/blog/contributions', blogController.submitBlogPostContribution);
  app.get('/api/blog/contributions/pending', blogController.getPendingContributions);
  app.post('/api/blog/contributions/:contributionId/review', blogController.reviewBlogPostContribution);
  app.post('/api/blog/contributions/:contributionId/mark-spam', blogController.markContributionAsSpam);
  
  // Upload API routes
  app.post('/api/upload', uploadController.uploadMedia);
  app.get('/uploads/:filename', uploadController.serveMedia);

  const httpServer = createServer(app);

  return httpServer;
}
