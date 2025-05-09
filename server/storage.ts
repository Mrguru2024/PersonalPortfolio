import { users, type User, type InsertUser, 
  projects, type Project, type InsertProject,
  skills, type Skill, type InsertSkill,
  skillEndorsements, type SkillEndorsement, type InsertSkillEndorsement,
  contacts, type Contact, type InsertContact,
  blogPosts, type BlogPost, type InsertBlogPost,
  blogComments, type BlogComment, type InsertBlogComment,
  blogPostContributions, type BlogPostContribution, type InsertBlogPostContribution,
  resumeRequests, type ResumeRequest, type InsertResumeRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import * as crypto from "crypto";

// Extended interface with portfolio-related CRUD operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Skill operations
  getSkills(): Promise<Skill[]>;
  getSkillsByCategory(category: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  
  // Skill endorsement operations
  getSkillEndorsements(skillId: number): Promise<SkillEndorsement[]>;
  createSkillEndorsement(endorsement: InsertSkillEndorsement, ipAddress: string): Promise<SkillEndorsement>;
  incrementSkillEndorsementCount(skillId: number): Promise<Skill>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  
  // Resume request operations
  createResumeRequest(request: InsertResumeRequest): Promise<ResumeRequest>;
  getResumeRequestByToken(token: string): Promise<ResumeRequest | undefined>;
  markResumeRequestAsAccessed(id: number): Promise<ResumeRequest>;
  
  // Blog operations
  getBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost, authorId: number): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  
  // Blog comment operations
  getCommentsByPostId(postId: number): Promise<BlogComment[]>;
  getApprovedCommentsByPostId(postId: number): Promise<BlogComment[]>;
  createComment(comment: InsertBlogComment, ipAddress: string): Promise<BlogComment>;
  approveComment(id: number): Promise<BlogComment>;
  markCommentAsSpam(id: number): Promise<BlogComment>;
  
  // Blog post contribution operations
  getBlogPostContributions(isReviewed?: boolean): Promise<BlogPostContribution[]>;
  getBlogPostContributionById(id: number): Promise<BlogPostContribution | undefined>;
  createBlogPostContribution(contribution: InsertBlogPostContribution, ipAddress: string): Promise<BlogPostContribution>;
  reviewBlogPostContribution(id: number, approve: boolean, notes?: string): Promise<BlogPostContribution>;
  markBlogPostContributionAsSpam(id: number): Promise<BlogPostContribution>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Project operations
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }
  
  async getProjectById(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [insertedProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return insertedProject;
  }
  
  // Skill operations
  async getSkills(): Promise<Skill[]> {
    return db.select().from(skills);
  }
  
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.category, category));
  }
  
  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [insertedSkill] = await db
      .insert(skills)
      .values(skill)
      .returning();
    return insertedSkill;
  }
  
  // Skill endorsement operations
  async getSkillEndorsements(skillId: number): Promise<SkillEndorsement[]> {
    return db
      .select()
      .from(skillEndorsements)
      .where(eq(skillEndorsements.skillId, skillId))
      .orderBy(desc(skillEndorsements.createdAt));
  }
  
  async createSkillEndorsement(endorsement: InsertSkillEndorsement, ipAddress: string): Promise<SkillEndorsement> {
    const now = new Date();
    const [insertedEndorsement] = await db
      .insert(skillEndorsements)
      .values({
        ...endorsement,
        ipAddress,
        createdAt: now
      })
      .returning();
    return insertedEndorsement;
  }
  
  async incrementSkillEndorsementCount(skillId: number): Promise<Skill> {
    // First get the current skill to check the current endorsement count
    const [currentSkill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, skillId));
    
    if (!currentSkill) {
      throw new Error(`Skill with ID ${skillId} not found`);
    }
    
    // Increment the endorsement count
    const [updatedSkill] = await db
      .update(skills)
      .set({
        endorsement_count: (currentSkill.endorsement_count || 0) + 1
      })
      .where(eq(skills.id, skillId))
      .returning();
    
    return updatedSkill;
  }
  
  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    const now = new Date().toISOString();
    const [insertedContact] = await db
      .insert(contacts)
      .values({ ...contact, createdAt: now })
      .returning();
    return insertedContact;
  }
  
  // Resume request operations
  async createResumeRequest(request: InsertResumeRequest): Promise<ResumeRequest> {
    const now = new Date();
    // Generate a unique token for resume access
    const accessToken = crypto.randomUUID().replace(/-/g, '');
    
    const [insertedRequest] = await db
      .insert(resumeRequests)
      .values({
        ...request,
        createdAt: now.toISOString(),
        accessToken,
        accessed: false,
      })
      .returning();
      
    return insertedRequest;
  }
  
  async getResumeRequestByToken(token: string): Promise<ResumeRequest | undefined> {
    const [request] = await db
      .select()
      .from(resumeRequests)
      .where(eq(resumeRequests.accessToken, token));
      
    return request || undefined;
  }
  
  async markResumeRequestAsAccessed(id: number): Promise<ResumeRequest> {
    const now = new Date();
    const [updatedRequest] = await db
      .update(resumeRequests)
      .set({
        accessed: true,
        accessedAt: now,
      })
      .where(eq(resumeRequests.id, id))
      .returning();
      
    return updatedRequest;
  }
  
  // Blog operations
  async getBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  }
  
  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return db.select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.publishedAt));
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    return post || undefined;
  }
  
  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post || undefined;
  }
  
  async createBlogPost(post: InsertBlogPost, authorId: number): Promise<BlogPost> {
    const [insertedPost] = await db
      .insert(blogPosts)
      .values({
        ...post,
        authorId,
        isPublished: false
      })
      .returning();
    return insertedPost;
  }
  
  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    const now = new Date();
    const [updatedPost] = await db
      .update(blogPosts)
      .set({
        ...post,
        updatedAt: now
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }
  
  // Blog comment operations
  async getCommentsByPostId(postId: number): Promise<BlogComment[]> {
    return db
      .select()
      .from(blogComments)
      .where(eq(blogComments.postId, postId))
      .orderBy(desc(blogComments.createdAt));
  }
  
  async getApprovedCommentsByPostId(postId: number): Promise<BlogComment[]> {
    return db
      .select()
      .from(blogComments)
      .where(and(
        eq(blogComments.postId, postId),
        eq(blogComments.isApproved, true)
      ))
      .orderBy(desc(blogComments.createdAt));
  }
  
  async createComment(comment: InsertBlogComment, ipAddress: string): Promise<BlogComment> {
    const now = new Date();
    const [insertedComment] = await db
      .insert(blogComments)
      .values({
        ...comment,
        ipAddress,
        createdAt: now,
        isApproved: false,
        isSpam: false
      })
      .returning();
    return insertedComment;
  }
  
  async approveComment(id: number): Promise<BlogComment> {
    const [approvedComment] = await db
      .update(blogComments)
      .set({ isApproved: true })
      .where(eq(blogComments.id, id))
      .returning();
    return approvedComment;
  }
  
  async markCommentAsSpam(id: number): Promise<BlogComment> {
    const [markedComment] = await db
      .update(blogComments)
      .set({ isSpam: true, isApproved: false })
      .where(eq(blogComments.id, id))
      .returning();
    return markedComment;
  }
  
  // Blog post contribution operations
  async getBlogPostContributions(isReviewed?: boolean): Promise<BlogPostContribution[]> {
    if (isReviewed !== undefined) {
      return db
        .select()
        .from(blogPostContributions)
        .where(eq(blogPostContributions.isReviewed, isReviewed))
        .orderBy(desc(blogPostContributions.createdAt));
    }
    return db
      .select()
      .from(blogPostContributions)
      .orderBy(desc(blogPostContributions.createdAt));
  }
  
  async getBlogPostContributionById(id: number): Promise<BlogPostContribution | undefined> {
    const [contribution] = await db
      .select()
      .from(blogPostContributions)
      .where(eq(blogPostContributions.id, id));
    return contribution || undefined;
  }
  
  async createBlogPostContribution(contribution: InsertBlogPostContribution, ipAddress: string): Promise<BlogPostContribution> {
    const now = new Date();
    const [insertedContribution] = await db
      .insert(blogPostContributions)
      .values({
        ...contribution,
        ipAddress,
        createdAt: now,
        isReviewed: false,
        isApproved: false,
        isSpam: false
      })
      .returning();
    return insertedContribution;
  }
  
  async reviewBlogPostContribution(id: number, approve: boolean, notes?: string): Promise<BlogPostContribution> {
    const [reviewedContribution] = await db
      .update(blogPostContributions)
      .set({ 
        isReviewed: true,
        isApproved: approve,
        reviewNotes: notes || null
      })
      .where(eq(blogPostContributions.id, id))
      .returning();
    return reviewedContribution;
  }
  
  async markBlogPostContributionAsSpam(id: number): Promise<BlogPostContribution> {
    const [markedContribution] = await db
      .update(blogPostContributions)
      .set({ 
        isSpam: true,
        isReviewed: true,
        isApproved: false
      })
      .where(eq(blogPostContributions.id, id))
      .returning();
    return markedContribution;
  }
}

export const storage = new DatabaseStorage();
