import { Request, Response } from 'express';
import { contactFormSchema, InsertContact } from '@shared/schema';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { format } from 'date-fns';

// Still import these for now as fallback until we populate the database
import { 
  projects as staticProjects, 
  frontendSkills,
  backendSkills,
  devopsSkills,
  additionalSkills,
  personalInfo,
  contactInfo,
  socialLinks 
} from '../../client/src/lib/data';

export const portfolioController = {
  getProjects: async (req: Request, res: Response) => {
    try {
      // Try to get projects from database
      const projects = await storage.getProjects();
      
      // If no projects found in DB, return static projects for now
      if (!projects || projects.length === 0) {
        return res.json(staticProjects);
      }
      
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Error fetching projects' });
    }
  },

  getProjectById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Try to get project from database
      const project = await storage.getProjectById(id);
      
      // If not found in DB, check static projects
      if (!project) {
        const staticProject = staticProjects.find(p => p.id === id);
        if (staticProject) {
          return res.json(staticProject);
        }
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: 'Error fetching project' });
    }
  },

  getSkills: async (req: Request, res: Response) => {
    try {
      // Try to get skills from database
      const allSkills = await storage.getSkills();
      
      // If no skills in DB, return static skills
      if (!allSkills || allSkills.length === 0) {
        return res.json({
          frontend: frontendSkills,
          backend: backendSkills,
          devops: devopsSkills,
          additional: additionalSkills
        });
      }
      
      // Group skills by category
      const frontend = allSkills.filter(skill => skill.category === 'frontend');
      const backend = allSkills.filter(skill => skill.category === 'backend');
      const devops = allSkills.filter(skill => skill.category === 'devops');
      
      res.json({
        frontend,
        backend,
        devops,
        additional: additionalSkills // Keep static additional skills for now
      });
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ message: 'Error fetching skills' });
    }
  },

  getPersonalInfo: (req: Request, res: Response) => {
    try {
      // For personal info and contact info, we'll keep using the static data
      // These could be moved to the database in the future if needed
      res.json({
        ...personalInfo,
        social: socialLinks
      });
    } catch (error) {
      console.error('Error fetching personal info:', error);
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
      console.error('Error fetching contact info:', error);
      res.status(500).json({ message: 'Error fetching contact info' });
    }
  },

  submitContactForm: async (req: Request, res: Response) => {
    try {
      // Validate request with Zod schema
      const validatedData = contactFormSchema.parse(req.body);
      
      // Create contact record in database
      const contactData: InsertContact = {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
      };
      
      const savedContact = await storage.createContact(contactData);
      
      res.status(200).json({ 
        message: 'Contact form submitted successfully',
        data: savedContact
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Error submitting contact form' });
    }
  },

  downloadResume: (req: Request, res: Response) => {
    try {
      // This endpoint could be enhanced to serve an actual PDF
      // For now, we'll return the static resume URL from personalInfo
      res.json({ 
        message: 'Resume download endpoint',
        resumeUrl: personalInfo.resumeUrl
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      res.status(500).json({ message: 'Error downloading resume' });
    }
  }
};
