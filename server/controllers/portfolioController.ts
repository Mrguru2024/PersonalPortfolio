import { Request, Response } from 'express';
import { 
  contactFormSchema, 
  InsertContact, 
  resumeRequestFormSchema, 
  InsertResumeRequest,
  skillEndorsementFormSchema,
  InsertSkillEndorsement,
  InsertSkill,
  Skill
} from '@shared/schema';
import { storage } from '../storage';
import { ZodError } from 'zod';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';
import { githubService } from '../services/githubService';

// Still import these for now as fallback until we populate the database
import { 
  projects as staticProjects, 
  frontendSkills as staticFrontendSkills,
  backendSkills as staticBackendSkills,
  devopsSkills as staticDevopsSkills,
  additionalSkills,
  personalInfo,
  contactInfo,
  socialLinks,
  type Skill as ClientSkill
} from '../../client/src/lib/data';

// Convert client-side skills to server-side skills with required fields
const convertToServerSkill = (clientSkill: ClientSkill, category: string): Skill => ({
  id: clientSkill.id || 0,
  name: clientSkill.name,
  percentage: clientSkill.percentage,
  category: clientSkill.category || category,
  endorsement_count: clientSkill.endorsement_count || 0
});

// Create strongly typed versions of the skills
const frontendSkills: Skill[] = staticFrontendSkills.map(skill => convertToServerSkill(skill, 'frontend'));
const backendSkills: Skill[] = staticBackendSkills.map(skill => convertToServerSkill(skill, 'backend'));
const devopsSkills: Skill[] = staticDevopsSkills.map(skill => convertToServerSkill(skill, 'devops'));

// For caching GitHub language stats
let cachedSkills: Record<string, Skill[]> | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

export const portfolioController = {
  // Skill endorsement endpoints
  getSkillEndorsements: async (req: Request, res: Response) => {
    try {
      const { skillId } = req.query;
      
      if (!skillId || isNaN(Number(skillId))) {
        return res.status(400).json({ error: "Valid skillId parameter is required" });
      }
      
      // Get endorsements for the specified skill
      const endorsements = await storage.getSkillEndorsements(Number(skillId));
      res.json(endorsements);
    } catch (error) {
      console.error("Error fetching skill endorsements:", error);
      res.status(500).json({ error: "Failed to fetch skill endorsements" });
    }
  },
  
  createSkillEndorsement: async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = skillEndorsementFormSchema.parse(req.body);
      
      // Get the IP address for spam prevention
      const forwardedFor = req.headers['x-forwarded-for'] as string;
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.ip || '127.0.0.1');
      
      // Create endorsement
      const endorsementData: InsertSkillEndorsement = {
        skillId: validatedData.skillId,
        name: validatedData.name,
        email: validatedData.email,
        comment: validatedData.comment || null,
        rating: validatedData.rating
      };
      
      const newEndorsement = await storage.createSkillEndorsement(endorsementData, ipAddress);
      
      // Increment the endorsement count for the skill
      await storage.incrementSkillEndorsementCount(validatedData.skillId);
      
      res.status(201).json(newEndorsement);
    } catch (error) {
      console.error("Error creating skill endorsement:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create skill endorsement" });
    }
  },
  
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

  // Updated method to fetch GitHub skills using enhanced service
  fetchGitHubSkills: async (): Promise<Record<string, Skill[]>> => {
    try {
      // Use the enhanced getSkillsData method from githubService
      // which handles caching, production fallbacks, etc.
      return await githubService.getSkillsData();
    } catch (error) {
      console.error('Error fetching GitHub skills:', error);
      // If we have cached data, return it even if expired
      if (cachedSkills) {
        console.log('Falling back to cached GitHub skills data due to error');
        return cachedSkills;
      }
      // Otherwise fallback to static data
      return {
        frontend: frontendSkills,
        backend: backendSkills,
        devops: devopsSkills
      };
    }
  },

  getSkills: async (req: Request, res: Response) => {
    try {
      // Use database as primary source for skills
      const allSkills = await storage.getSkills();
      
      // If we have skills in the database, use them as the primary source
      if (allSkills && allSkills.length > 0) {
        // Group skills by category
        const frontend = allSkills.filter(skill => skill.category === 'frontend');
        const backend = allSkills.filter(skill => skill.category === 'backend');
        const devops = allSkills.filter(skill => skill.category === 'devops');
        
        return res.json({
          frontend,
          backend,
          devops,
          additional: additionalSkills
        });
      }
      
      // If no skills in database, fall back to GitHub data
      try {
        if (process.env.GITHUB_TOKEN) {
          console.log('No skills in database. Using GitHub token for skills data.');
          const githubSkills = await portfolioController.fetchGitHubSkills();
          
          // Also sync with database (for future use)
          await portfolioController.syncGitHubSkillsWithDatabase(githubSkills);
          
          return res.json({
            frontend: githubSkills.frontend,
            backend: githubSkills.backend,
            devops: githubSkills.devops,
            additional: additionalSkills
          });
        } else {
          console.log('No GitHub token found, using static skills');
        }
      } catch (githubError) {
        console.error('Error fetching GitHub skills:', githubError);
        // Continue to fallback options below
      }
      
      // If neither database nor GitHub has skills, use static data
      return res.json({
        frontend: frontendSkills,
        backend: backendSkills,
        devops: devopsSkills,
        additional: additionalSkills
      });
    } catch (error) {
      console.error('Error fetching skills:', error);
      res.status(500).json({ message: 'Error fetching skills' });
    }
  },

  // Sync GitHub skills with the database to persist endorsements
  syncGitHubSkillsWithDatabase: async (githubSkills: Record<string, Skill[]>) => {
    try {
      // Get all skills from database
      const dbSkills = await storage.getSkills();
      
      // Create a map of existing skill names to their database records
      const dbSkillsMap = new Map<string, Skill>();
      dbSkills.forEach(skill => {
        dbSkillsMap.set(skill.name, skill);
      });
      
      // Process each category of skills
      for (const category of ['frontend', 'backend', 'devops'] as const) {
        for (const githubSkill of githubSkills[category]) {
          const existingSkill = dbSkillsMap.get(githubSkill.name);
          
          if (existingSkill) {
            // Update existing skill with new percentage but keep endorsement count
            githubSkill.endorsement_count = existingSkill.endorsement_count;
            githubSkill.id = existingSkill.id;
          } else {
            // This is a new skill discovered from GitHub, will be inserted with 0 endorsements
            githubSkill.endorsement_count = 0;
          }
        }
      }
      
      // For simplicity, we're not removing skills that are no longer in GitHub data
      // This would require more complex synchronization logic
      
      return githubSkills;
    } catch (error) {
      console.error('Error syncing GitHub skills with database:', error);
      throw error;
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
