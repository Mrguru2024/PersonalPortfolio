import { Request, Response } from 'express';
import path from 'path';
import { Project, Contact } from '@shared/schema';
import fs from 'fs';

// Import data from the frontend (simulating database)
import { 
  projects, 
  frontendSkills,
  backendSkills,
  devopsSkills,
  additionalSkills,
  personalInfo,
  contactInfo,
  socialLinks 
} from '../../client/src/lib/data';

export const portfolioController = {
  getProjects: (req: Request, res: Response) => {
    try {
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching projects' });
    }
  },

  getProjectById: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const project = projects.find(p => p.id === id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching project' });
    }
  },

  getSkills: (req: Request, res: Response) => {
    try {
      res.json({
        frontend: frontendSkills,
        backend: backendSkills,
        devops: devopsSkills,
        additional: additionalSkills
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching skills' });
    }
  },

  getPersonalInfo: (req: Request, res: Response) => {
    try {
      res.json({
        ...personalInfo,
        social: socialLinks
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching personal info' });
    }
  },

  getContactInfo: (req: Request, res: Response) => {
    try {
      res.json({
        ...contactInfo,
        social: socialLinks
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching contact info' });
    }
  },

  submitContactForm: (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate input
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // In a real app, you would save this to a database and/or send an email
      // For demo purposes, we'll just return success
      
      res.status(200).json({ 
        message: 'Contact form submitted successfully',
        data: { name, email, subject, message }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting contact form' });
    }
  },

  downloadResume: (req: Request, res: Response) => {
    try {
      // In a real application, you would have a real PDF file to serve
      // For demo purposes, we'll just send a JSON response
      res.json({ message: 'Resume download endpoint - would serve a PDF in production' });
    } catch (error) {
      res.status(500).json({ message: 'Error downloading resume' });
    }
  }
};
