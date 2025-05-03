import { Request, Response } from 'express';
import { contactFormSchema, InsertContact, resumeRequestFormSchema, InsertResumeRequest } from '@shared/schema';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';
import { adaptToClientModel, Project } from '../../client/src/lib/data';

// Helper function to log object structure
function logObjectStructure(obj: any, label: string) {
  console.log(`[DEBUG] ${label} - Property names: ${Object.keys(obj).join(', ')}`);
}

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
      const dbProjects = await storage.getProjects();
      
      // If no projects found in DB, return static projects for now
      if (!dbProjects || dbProjects.length === 0) {
        return res.json(staticProjects);
      }
      
      if (dbProjects.length > 0) {
        logObjectStructure(dbProjects[0], 'DB Project');
      }
      
      // Convert DB model to client model using the adapter
      const clientProjects = dbProjects.map(project => {
        const adapted = adaptToClientModel(project);
        return adapted;
      });
      
      if (clientProjects.length > 0) {
        logObjectStructure(clientProjects[0], 'Client Project');
      }
      
      res.json(clientProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Error fetching projects' });
    }
  },

  getProjectById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Try to get project from database
      const dbProject = await storage.getProjectById(id);
      
      // If not found in DB, check static projects
      if (!dbProject) {
        const staticProject = staticProjects.find(p => p.id === id);
        if (staticProject) {
          return res.json(staticProject);
        }
        return res.status(404).json({ message: 'Project not found' });
      }
      
      logObjectStructure(dbProject, 'DB Project');
      
      // Convert DB model to client model using the adapter
      const clientProject = adaptToClientModel(dbProject);
      
      logObjectStructure(clientProject, 'Client Project');
      
      res.json(clientProject);
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

  requestResume: async (req: Request, res: Response) => {
    try {
      // Validate request with Zod schema
      const validatedData = resumeRequestFormSchema.parse(req.body);
      
      // Create resume request record in database
      const requestData: InsertResumeRequest = {
        name: validatedData.name,
        email: validatedData.email,
        company: validatedData.company || '',
        purpose: validatedData.purpose,
        message: validatedData.message || '',
      };
      
      const savedRequest = await storage.createResumeRequest(requestData);
      
      // Return only the token to the client - we'll use this to validate the download
      res.status(200).json({ 
        message: 'Resume request submitted successfully',
        accessToken: savedRequest.accessToken
      });
    } catch (error) {
      console.error('Error submitting resume request:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Error submitting resume request' });
    }
  },
  
  downloadResume: async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: 'Access token is required' });
      }
      
      // Verify the token exists and is valid
      const request = await storage.getResumeRequestByToken(token);
      
      if (!request) {
        return res.status(404).json({ message: 'Invalid access token' });
      }
      
      // Mark the resume as accessed
      await storage.markResumeRequestAsAccessed(request.id);
      
      // For now, we'll return the static resume URL, but this could be enhanced to serve an actual PDF
      // In a production environment, you'd likely have the resume stored in a secured location
      // and only serve it with valid tokens
      res.json({ 
        message: 'Resume access granted',
        resumeUrl: personalInfo.resumeUrl,
        name: request.name
      });
      
      // Alternative: If you have a PDF file to serve directly:
      /*
      const resumePath = path.join(__dirname, '../../assets/resume.pdf');
      
      if (!fs.existsSync(resumePath)) {
        return res.status(404).json({ message: 'Resume file not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="AnthonyFeaster_Resume.pdf"`);
      
      const fileStream = fs.createReadStream(resumePath);
      fileStream.pipe(res);
      */
    } catch (error) {
      console.error('Error downloading resume:', error);
      res.status(500).json({ message: 'Error downloading resume' });
    }
  }
};
