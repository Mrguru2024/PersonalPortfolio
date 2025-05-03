import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { portfolioController } from "./controllers/portfolioController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Portfolio API routes
  app.get('/api/projects', portfolioController.getProjects);
  app.get('/api/projects/:id', portfolioController.getProjectById);
  app.get('/api/skills', portfolioController.getSkills);
  app.get('/api/info', portfolioController.getPersonalInfo);
  app.get('/api/contact', portfolioController.getContactInfo);
  app.post('/api/contact', portfolioController.submitContactForm);
  app.get('/api/resume', portfolioController.downloadResume);

  const httpServer = createServer(app);

  return httpServer;
}
