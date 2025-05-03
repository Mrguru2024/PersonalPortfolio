import { users, type User, type InsertUser, 
  projects, type Project, type InsertProject,
  skills, type Skill, type InsertSkill,
  contacts, type Contact, type InsertContact,
  blogPosts, type BlogPost, type InsertBlogPost,
  blogComments, type BlogComment, type InsertBlogComment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Extended interface with portfolio-related CRUD operations
export interface IStorage {
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
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  
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
  createComment(comment: InsertBlogComment): Promise<BlogComment>;
  approveComment(id: number): Promise<BlogComment>;
}

export class DatabaseStorage implements IStorage {
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
  
  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    const now = new Date().toISOString();
    const [insertedContact] = await db
      .insert(contacts)
      .values({ ...contact, createdAt: now })
      .returning();
    return insertedContact;
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
  
  async createComment(comment: InsertBlogComment): Promise<BlogComment> {
    const now = new Date();
    const [insertedComment] = await db
      .insert(blogComments)
      .values({
        ...comment,
        createdAt: now,
        isApproved: false
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
}

export const storage = new DatabaseStorage();
