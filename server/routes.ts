import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { portfolioController } from "./controllers/portfolioController";
import { blogController } from "./controllers/blogController";
import { uploadController } from "./controllers/uploadController";
import { setupAuth } from "./auth";

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Admin middleware
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // Portfolio API routes
  app.get('/api/projects', portfolioController.getProjects);
  app.get('/api/projects/:id', portfolioController.getProjectById);
  app.get('/api/skills', portfolioController.getSkills);
  app.get('/api/info', portfolioController.getPersonalInfo);
  app.get('/api/contact', portfolioController.getContactInfo);
  app.post('/api/contact', portfolioController.submitContactForm);
  app.get('/api/resume', portfolioController.downloadResume);
  
  // Blog API routes - public
  app.get('/api/blog', blogController.getBlogPosts);
  app.get('/api/blog/post/:postId/comments', blogController.getPostComments);
  app.post('/api/blog/post/:postId/comments', blogController.addComment);  // Consider adding CAPTCHA here
  app.get('/api/blog/:slug', blogController.getBlogPostBySlug);
  
  // Blog API routes - authenticated users
  app.post('/api/blog/contributions', blogController.submitBlogPostContribution);  // Any authenticated user can submit
  
  // Blog API routes - admin only
  app.post('/api/blog', isAdmin, blogController.createBlogPost);
  
  // Blog moderation routes - admin only
  app.get('/api/blog/comments/pending', isAdmin, blogController.getPendingComments);
  app.get('/api/blog/comments/pending/:postId', isAdmin, blogController.getPendingComments);
  app.post('/api/blog/comments/:commentId/approve', isAdmin, blogController.approveComment);
  app.post('/api/blog/comments/:commentId/mark-spam', isAdmin, blogController.markCommentAsSpam);
  
  // Blog contribution routes - admin only
  app.get('/api/blog/contributions/pending', isAdmin, blogController.getPendingContributions);
  app.post('/api/blog/contributions/:contributionId/review', isAdmin, blogController.reviewBlogPostContribution);
  app.post('/api/blog/contributions/:contributionId/mark-spam', isAdmin, blogController.markContributionAsSpam);
  
  // Upload API routes
  app.post('/api/upload', isAdmin, uploadController.uploadMedia); // Only admins can upload
  app.get('/uploads/:filename', uploadController.serveMedia); // But everyone can view uploaded files

  const httpServer = createServer(app);

  return httpServer;
}
