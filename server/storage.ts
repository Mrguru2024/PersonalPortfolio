import { users, type User, type InsertUser, 
  projects, type Project, type InsertProject,
  skills, type Skill, type InsertSkill,
  skillEndorsements, type SkillEndorsement, type InsertSkillEndorsement,
  contacts, type Contact, type InsertContact,
  blogPosts, type BlogPost, type InsertBlogPost,
  blogComments, type BlogComment, type InsertBlogComment,
  blogPostContributions, type BlogPostContribution, type InsertBlogPostContribution,
  resumeRequests, type ResumeRequest, type InsertResumeRequest,
  projectAssessments, type ProjectAssessment, type InsertProjectAssessment,
  clientQuotes, type ClientQuote, type InsertClientQuote,
  clientInvoices, type ClientInvoice, type InsertClientInvoice,
  clientAnnouncements, type ClientAnnouncement, type InsertClientAnnouncement,
  clientFeedback, type ClientFeedback, type InsertClientFeedback,
  funnelContent, type FunnelContent, type InsertFunnelContent
} from "@shared/schema";
import { blogPostViews, type BlogPostView, type InsertBlogPostView } from "@shared/blogAnalyticsSchema";
import {
  newsletterSubscribers, type NewsletterSubscriber, type InsertNewsletterSubscriber,
  newsletters, type Newsletter, type InsertNewsletter,
  newsletterSends, type NewsletterSend, type InsertNewsletterSend
} from "@shared/newsletterSchema";
import {
  crmContacts, type CrmContact, type InsertCrmContact,
  crmDeals, type CrmDeal, type InsertCrmDeal,
  crmActivities, type CrmActivity, type InsertCrmActivity,
  communicationEvents, type CommunicationEvent, type InsertCommunicationEvent,
  documentEvents, documentEventLog, type DocumentEvent, type InsertDocumentEvent, type InsertDocumentEventLog,
  visitorActivity, type VisitorActivity, type InsertVisitorActivity,
  crmAlerts, type CrmAlert, type InsertCrmAlert,
  crmTasks, type CrmTask, type InsertCrmTask,
  crmSequences, type CrmSequence, type InsertCrmSequence,
  crmSequenceEnrollments, type CrmSequenceEnrollment, type InsertCrmSequenceEnrollment,
  crmSavedLists, type CrmSavedList, type InsertCrmSavedList,
} from "@shared/crmSchema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, isNull, isNotNull, lt, or, gte } from "drizzle-orm";
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
  updateUser(id: number, updates: Partial<InsertUser> & { resetToken?: string | null; resetTokenExpiry?: Date | null }): Promise<User>;
  
  getFunnelContent(slug: string): Promise<FunnelContent | undefined>;
  setFunnelContent(slug: string, data: Record<string, unknown>): Promise<FunnelContent>;
  
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
  getAllContacts(): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  
  // Project Assessment operations
  getAllAssessments(): Promise<ProjectAssessment[]>;
  getAssessmentById(id: number): Promise<ProjectAssessment | undefined>;
  getDeletedAssessments(): Promise<ProjectAssessment[]>;
  updateAssessmentStatus(id: number, status: string): Promise<ProjectAssessment>;
  deleteAssessment(id: number): Promise<void>;
  restoreAssessment(id: number): Promise<ProjectAssessment>;
  
  // Resume request operations
  createResumeRequest(request: InsertResumeRequest): Promise<ResumeRequest>;
  getAllResumeRequests(): Promise<ResumeRequest[]>;
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
  
  // Blog analytics operations
  trackBlogPostView(view: InsertBlogPostView): Promise<BlogPostView>;
  updateBlogPostView(id: number, updates: Partial<InsertBlogPostView> & { lastActivityAt?: Date }): Promise<BlogPostView>;
  getBlogPostViews(postId: number): Promise<BlogPostView[]>;
  getBlogPostAnalytics(postId: number): Promise<{
    totalViews: number;
    uniqueViews: number;
    averageScrollDepth: number;
    averageTimeSpent: number;
    completionRate: number;
  }>;
  incrementBlogPostViewCount(postId: number): Promise<BlogPost>;
  approveComment(id: number): Promise<BlogComment>;
  markCommentAsSpam(id: number): Promise<BlogComment>;
  
  // Blog post contribution operations
  getBlogPostContributions(isReviewed?: boolean): Promise<BlogPostContribution[]>;
  getBlogPostContributionById(id: number): Promise<BlogPostContribution | undefined>;
  createBlogPostContribution(contribution: InsertBlogPostContribution, ipAddress: string): Promise<BlogPostContribution>;
  reviewBlogPostContribution(id: number, approve: boolean, notes?: string): Promise<BlogPostContribution>;
  markBlogPostContributionAsSpam(id: number): Promise<BlogPostContribution>;
  
  // Newsletter subscriber operations
  createSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  getAllSubscribers(includeUnsubscribed?: boolean): Promise<NewsletterSubscriber[]>;
  updateSubscriber(id: number, updates: Partial<InsertNewsletterSubscriber> & { unsubscribedAt?: Date | null; subscribedAt?: Date | null }): Promise<NewsletterSubscriber>;
  unsubscribeSubscriber(id: number): Promise<NewsletterSubscriber>;
  deleteSubscriber(id: number): Promise<void>;
  
  // Newsletter operations
  createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  getNewsletterById(id: number): Promise<Newsletter | undefined>;
  getAllNewsletters(): Promise<Newsletter[]>;
  updateNewsletter(id: number, updates: Partial<InsertNewsletter> & { sentAt?: Date; scheduledAt?: Date; updatedAt?: Date; sentCount?: number; failedCount?: number; deliveredCount?: number; openedCount?: number; clickedCount?: number; totalRecipients?: number }): Promise<Newsletter>;
  deleteNewsletter(id: number): Promise<void>;
  
  // Newsletter send operations
  createNewsletterSend(send: InsertNewsletterSend): Promise<NewsletterSend>;
  updateNewsletterSend(id: number, updates: Partial<InsertNewsletterSend> & { sentAt?: Date; deliveredAt?: Date; openedAt?: Date; clickedAt?: Date; failedAt?: Date }): Promise<NewsletterSend>;
  getNewsletterSends(newsletterId: number): Promise<NewsletterSend[]>;
  getSubscriberSends(subscriberId: number): Promise<NewsletterSend[]>;
  getOrCreateSubscriberForEmail(email: string, source?: string): Promise<NewsletterSubscriber>;
  
  // Client dashboard operations
  getClientQuotes(userId: number): Promise<ClientQuote[]>;
  getClientQuoteById(id: number, userId: number): Promise<ClientQuote | undefined>;
  updateClientQuoteStatus(id: number, userId: number, status: "accepted" | "rejected"): Promise<ClientQuote>;
  getClientInvoices(userId: number): Promise<ClientInvoice[]>;
  getClientAnnouncements(userId: number): Promise<ClientAnnouncement[]>;
  getClientFeedback(userId: number): Promise<ClientFeedback[]>;
  createClientFeedback(feedback: InsertClientFeedback): Promise<ClientFeedback>;
  getClientProjects(userId: number): Promise<ProjectAssessment[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllClientFeedback(): Promise<ClientFeedback[]>;
  updateClientFeedback(id: number, updates: Partial<InsertClientFeedback> & { respondedBy?: number; respondedAt?: Date }): Promise<ClientFeedback>;
  // Invoice admin operations
  getAllInvoices(): Promise<ClientInvoice[]>;
  getInvoiceById(id: number): Promise<ClientInvoice | undefined>;
  createInvoice(invoice: InsertClientInvoice): Promise<ClientInvoice>;
  updateInvoice(id: number, updates: Partial<InsertClientInvoice> & { paidAt?: Date | null; lastReminderAt?: Date | null }): Promise<ClientInvoice>;
  deleteInvoice(id: number): Promise<void>;
  getInvoiceByStripeId(stripeInvoiceId: string): Promise<ClientInvoice | undefined>;
  // Announcements admin operations
  getAllAnnouncements(): Promise<ClientAnnouncement[]>;
  getPublicAnnouncements(): Promise<ClientAnnouncement[]>;
  getAnnouncementById(id: number): Promise<ClientAnnouncement | undefined>;
  createAnnouncement(announcement: Omit<InsertClientAnnouncement, "id">): Promise<ClientAnnouncement>;
  updateAnnouncement(id: number, updates: Partial<InsertClientAnnouncement>): Promise<ClientAnnouncement>;
  deleteAnnouncement(id: number): Promise<void>;

  // CRM operations
  getCrmContacts(type?: "lead" | "client"): Promise<CrmContact[]>;
  getCrmContactById(id: number): Promise<CrmContact | undefined>;
  createCrmContact(contact: InsertCrmContact): Promise<CrmContact>;
  updateCrmContact(id: number, updates: Partial<InsertCrmContact>): Promise<CrmContact>;
  deleteCrmContact(id: number): Promise<void>;
  getCrmDeals(contactId?: number): Promise<(CrmDeal & { contact?: CrmContact })[]>;
  getCrmDealById(id: number): Promise<CrmDeal | undefined>;
  createCrmDeal(deal: InsertCrmDeal): Promise<CrmDeal>;
  updateCrmDeal(id: number, updates: Partial<InsertCrmDeal>): Promise<CrmDeal>;
  deleteCrmDeal(id: number): Promise<void>;
  getCrmActivities(contactId: number): Promise<CrmActivity[]>;
  createCrmActivity(activity: InsertCrmActivity): Promise<CrmActivity>;
  getCrmContactsByEmails(emails: string[]): Promise<CrmContact[]>;

  // Lead intelligence: communication events
  createCommunicationEvent(event: InsertCommunicationEvent): Promise<CommunicationEvent>;
  getCommunicationEventsByLeadId(leadId: number): Promise<CommunicationEvent[]>;

  // Lead intelligence: document engagement
  upsertDocumentEvent(data: {
    documentId: string;
    documentType: string;
    leadId: number | null;
    quoteId: number | null;
    viewTimeSeconds?: number;
    eventDetail: string;
    deviceType?: string | null;
    location?: string | null;
  }): Promise<DocumentEvent>;
  getDocumentEventsByLeadId(leadId: number): Promise<DocumentEvent[]>;
  getDocumentEventLogByLeadId(leadId: number): Promise<{ id: number; documentId: string; documentType: string; eventDetail: string; viewTimeSeconds: number | null; createdAt: Date }[]>;

  // Lead intelligence: visitor activity
  createVisitorActivity(activity: InsertVisitorActivity): Promise<VisitorActivity>;
  attachVisitorToLead(visitorId: string, leadId: number): Promise<void>;
  getVisitorActivityByLeadId(leadId: number): Promise<VisitorActivity[]>;

  // Lead intelligence: alerts
  createCrmAlert(alert: InsertCrmAlert): Promise<CrmAlert>;
  getCrmAlerts(leadId?: number, unreadOnly?: boolean): Promise<(CrmAlert & { lead?: CrmContact })[]>;
  markCrmAlertRead(id: number): Promise<void>;

  // Resolve CRM lead from quote (assessment email)
  getCrmContactIdByQuoteId(quoteId: number): Promise<number | null>;

  // Engagement analytics (counts for dashboard)
  getCrmEngagementStats(): Promise<{
    emailOpens: number;
    emailClicks: number;
    documentViews: number;
    highIntentLeadsCount: number;
    unreadAlertsCount: number;
  }>;

  // Tasks (Apollo-style)
  createCrmTask(task: InsertCrmTask): Promise<CrmTask>;
  updateCrmTask(id: number, updates: Partial<InsertCrmTask>): Promise<CrmTask>;
  deleteCrmTask(id: number): Promise<void>;
  getCrmTasksByContactId(contactId: number): Promise<CrmTask[]>;
  getCrmTasks(filters: { contactId?: number; overdueOnly?: boolean; incompleteOnly?: boolean }): Promise<(CrmTask & { contact?: CrmContact })[]>;

  // Sequences
  createCrmSequence(seq: InsertCrmSequence): Promise<CrmSequence>;
  getCrmSequences(): Promise<CrmSequence[]>;
  getCrmSequenceById(id: number): Promise<CrmSequence | undefined>;
  updateCrmSequence(id: number, updates: Partial<InsertCrmSequence>): Promise<CrmSequence>;
  createCrmSequenceEnrollment(enrollment: InsertCrmSequenceEnrollment): Promise<CrmSequenceEnrollment>;
  getCrmSequenceEnrollments(contactId?: number, sequenceId?: number): Promise<(CrmSequenceEnrollment & { contact?: CrmContact; sequence?: CrmSequence })[]>;
  updateCrmSequenceEnrollment(id: number, updates: Partial<InsertCrmSequenceEnrollment>): Promise<CrmSequenceEnrollment>;

  // Saved lists
  createCrmSavedList(list: InsertCrmSavedList): Promise<CrmSavedList>;
  getCrmSavedLists(): Promise<CrmSavedList[]>;
  getCrmSavedListById(id: number): Promise<CrmSavedList | undefined>;
  updateCrmSavedList(id: number, updates: Partial<InsertCrmSavedList>): Promise<CrmSavedList>;
  deleteCrmSavedList(id: number): Promise<void>;
  getCrmContactsBySavedListFilters(filters: CrmSavedList["filters"]): Promise<CrmContact[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
    
    // Wrap prune method to handle ENOENT errors gracefully
    // connect-pg-simple may try to read table.sql during pruning, which can fail
    // This is a known issue when the module can't find the SQL file
    // Type assertion needed because prune is specific to connect-pg-simple's store
    const storeWithPrune = this.sessionStore as any;
    if (typeof storeWithPrune.prune === 'function') {
      const originalPrune = storeWithPrune.prune.bind(this.sessionStore);
      storeWithPrune.prune = function() {
        try {
          return originalPrune();
        } catch (error: any) {
          // Ignore ENOENT errors for table.sql - the table may already exist
          // The prune operation will succeed once the table is created
          if (error?.code === 'ENOENT' && (error?.path?.includes('table.sql') || error?.path?.includes('connect-pg-simple'))) {
            // Silently ignore - table will be created by createTableIfMissing
            // Don't log these errors as they're expected in some environments
            return;
          }
          // Log other errors but don't crash the application
          console.error('Session prune error:', error);
          return;
        }
      };
    }
    
    // Also wrap the startPruning method if it exists
    if (typeof storeWithPrune.startPruning === 'function') {
      const originalStartPruning = storeWithPrune.startPruning.bind(this.sessionStore);
      storeWithPrune.startPruning = function() {
        try {
          return originalStartPruning();
        } catch (error: any) {
          // Ignore ENOENT errors during pruning initialization
          if (error?.code === 'ENOENT' && (error?.path?.includes('table.sql') || error?.path?.includes('connect-pg-simple'))) {
            return;
          }
          console.error('Session startPruning error:', error);
          return;
        }
      };
    }
    
    // Normalize to a plain Error so callers never receive ErrorEvent (read-only .message) and cause "Cannot set property message"
    function toPlainError(e: unknown): Error {
      if (e instanceof Error && e.constructor.name === 'Error') return e;
      const msg = e != null && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : String(e);
      return new Error(msg);
    }

    // Wrap the get method to handle ENOENT errors and timeouts gracefully
    const originalGet = this.sessionStore.get.bind(this.sessionStore);
    this.sessionStore.get = function(sid: string, callback: (err?: any, session?: any) => void) {
      const timeout = setTimeout(() => {
        callback(undefined, null);
      }, 1500);

      try {
        originalGet(sid, (err: unknown, session: any) => {
          clearTimeout(timeout);

          if (err) {
            if (typeof err === 'object' && err !== null && 'code' in err) {
              const code = (err as { code?: string }).code;
              const path = (err as { path?: string }).path;
              const msg = (err as { message?: string }).message;
              if (code === 'ENOENT' && (path?.includes('table.sql') || path?.includes('connect-pg-simple'))) {
                return callback(undefined, null);
              }
              if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || (typeof msg === 'string' && msg.includes('timeout'))) {
                return callback(undefined, null);
              }
            }
            return callback(toPlainError(err), session);
          }
          callback(undefined, session);
        });
      } catch (error: unknown) {
        clearTimeout(timeout);
        if (error && typeof error === 'object' && 'code' in error) {
          const code = (error as { code?: string }).code;
          const path = (error as { path?: string }).path;
          const msg = (error as { message?: string }).message;
          if (code === 'ENOENT' && (path?.includes('table.sql') || path?.includes('connect-pg-simple'))) {
            return callback(undefined, null);
          }
          if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || (typeof msg === 'string' && msg.includes('timeout'))) {
            return callback(undefined, null);
          }
        }
        callback(toPlainError(error), null);
      }
    };
  }

  /** Insert session directly into DB (fallback when connect-pg-simple fails with ENOENT table.sql) */
  async insertSessionDirect(sid: string, sess: Record<string, unknown>, expire: Date): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO session (sid, sess, expire) VALUES ($1, $2, $3) ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3',
        [sid, JSON.stringify(sess), expire]
      );
    } finally {
      client.release();
    }
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser as typeof users.$inferInsert)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser> & { resetToken?: string | null; resetTokenExpiry?: Date | null }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates as Partial<User> & { resetToken?: string | null; resetTokenExpiry?: Date | null })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getFunnelContent(slug: string): Promise<FunnelContent | undefined> {
    const [row] = await db.select().from(funnelContent).where(eq(funnelContent.slug, slug));
    return row ?? undefined;
  }

  async setFunnelContent(slug: string, data: Record<string, unknown>): Promise<FunnelContent> {
    const [row] = await db
      .insert(funnelContent)
      .values({ slug, data, updated_at: new Date() })
      .onConflictDoUpdate({
        target: funnelContent.slug,
        set: { data, updated_at: new Date() },
      })
      .returning();
    return row;
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
    type PricingEstimateValue = NonNullable<Contact["pricingEstimate"]>;
    const isPricingEstimate = (v: unknown): v is PricingEstimateValue =>
      v != null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      "estimatedRange" in (v as object) &&
      "marketComparison" in (v as object);
    const pricingEstimate = isPricingEstimate(contact.pricingEstimate)
      ? contact.pricingEstimate
      : null;
    const [insertedContact] = await db
      .insert(contacts)
      .values({ ...contact, createdAt: now, pricingEstimate })
      .returning();
    return insertedContact;
  }
  
  async getAllContacts(): Promise<Contact[]> {
    return db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt));
  }
  
  async getContactById(id: number): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact || undefined;
  }
  
  // Project Assessment operations (soft delete: deleted_at set = hidden, restore = clear deleted_at)
  // Fallback when deleted_at column does not exist yet (e.g. production before migration)
  private static assessmentColumnsWithoutDeletedAt = {
    id: projectAssessments.id,
    name: projectAssessments.name,
    email: projectAssessments.email,
    phone: projectAssessments.phone,
    company: projectAssessments.company,
    role: projectAssessments.role,
    assessmentData: projectAssessments.assessmentData,
    pricingBreakdown: projectAssessments.pricingBreakdown,
    status: projectAssessments.status,
    createdAt: projectAssessments.createdAt,
    updatedAt: projectAssessments.updatedAt,
  };

  private static isMissingColumnError(e: unknown): boolean {
    const msg = String(e instanceof Error ? e.message : e).toLowerCase();
    return msg.includes("deleted_at") || (msg.includes("column") && msg.includes("does not exist"));
  }

  async getAllAssessments(): Promise<ProjectAssessment[]> {
    try {
      return await db
        .select()
        .from(projectAssessments)
        .where(isNull(projectAssessments.deletedAt))
        .orderBy(desc(projectAssessments.id));
    } catch (e) {
      if (!DatabaseStorage.isMissingColumnError(e)) throw e;
      const rows = await db
        .select(DatabaseStorage.assessmentColumnsWithoutDeletedAt)
        .from(projectAssessments)
        .orderBy(desc(projectAssessments.id));
      return rows as unknown as ProjectAssessment[];
    }
  }

  async getAssessmentById(id: number): Promise<ProjectAssessment | undefined> {
    try {
      const [assessment] = await db
        .select()
        .from(projectAssessments)
        .where(and(eq(projectAssessments.id, id), isNull(projectAssessments.deletedAt)));
      return assessment || undefined;
    } catch (e) {
      if (!DatabaseStorage.isMissingColumnError(e)) throw e;
      const [row] = await db
        .select(DatabaseStorage.assessmentColumnsWithoutDeletedAt)
        .from(projectAssessments)
        .where(eq(projectAssessments.id, id))
        .limit(1);
      return (row as ProjectAssessment | undefined) ?? undefined;
    }
  }

  async getDeletedAssessments(): Promise<ProjectAssessment[]> {
    try {
      return await db
        .select()
        .from(projectAssessments)
        .where(isNotNull(projectAssessments.deletedAt))
        .orderBy(desc(projectAssessments.deletedAt));
    } catch (e) {
      if (!DatabaseStorage.isMissingColumnError(e)) throw e;
      return [];
    }
  }

  async updateAssessmentStatus(id: number, status: string): Promise<ProjectAssessment> {
    const now = new Date();
    try {
      const [updated] = await db
        .update(projectAssessments)
        .set({ status, updatedAt: now })
        .where(and(eq(projectAssessments.id, id), isNull(projectAssessments.deletedAt)))
        .returning();
      if (!updated) throw new Error("Assessment not found");
      return updated;
    } catch (e) {
      if (!DatabaseStorage.isMissingColumnError(e)) throw e;
      const [updated] = await db
        .update(projectAssessments)
        .set({ status, updatedAt: now })
        .where(eq(projectAssessments.id, id))
        .returning(DatabaseStorage.assessmentColumnsWithoutDeletedAt);
      if (!updated) throw new Error("Assessment not found");
      return updated as unknown as ProjectAssessment;
    }
  }

  async deleteAssessment(id: number): Promise<void> {
    try {
      const [row] = await db
        .select({ id: projectAssessments.id })
        .from(projectAssessments)
        .where(and(eq(projectAssessments.id, id), isNull(projectAssessments.deletedAt)));
      if (!row) throw new Error("Assessment not found");
      await db
        .update(projectAssessments)
        .set({ deletedAt: new Date() })
        .where(eq(projectAssessments.id, id));
    } catch (e) {
      if (!DatabaseStorage.isMissingColumnError(e)) throw e;
      const [row] = await db
        .select({ id: projectAssessments.id })
        .from(projectAssessments)
        .where(eq(projectAssessments.id, id))
        .limit(1);
      if (!row) throw new Error("Assessment not found");
      await db.delete(projectAssessments).where(eq(projectAssessments.id, id));
    }
  }

  async restoreAssessment(id: number): Promise<ProjectAssessment> {
    try {
      const [restored] = await db
        .update(projectAssessments)
        .set({ deletedAt: null })
        .where(eq(projectAssessments.id, id))
        .returning();
      if (!restored) throw new Error("Assessment not found");
      return restored;
    } catch (e) {
      if (!DatabaseStorage.isMissingColumnError(e)) throw e;
      const [row] = await db
        .select(DatabaseStorage.assessmentColumnsWithoutDeletedAt)
        .from(projectAssessments)
        .where(eq(projectAssessments.id, id))
        .limit(1);
      if (!row) throw new Error("Assessment not found");
      return row as ProjectAssessment;
    }
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
  
  async getAllResumeRequests(): Promise<ResumeRequest[]> {
    return db
      .select()
      .from(resumeRequests)
      .orderBy(desc(resumeRequests.createdAt));
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
        coverImage: post.coverImage || '',
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
  
  // Blog analytics operations
  async trackBlogPostView(view: InsertBlogPostView): Promise<BlogPostView> {
    const now = new Date();
    const [insertedView] = await db
      .insert(blogPostViews)
      .values({
        ...view,
        viewedAt: now,
        lastActivityAt: now,
      })
      .returning();
    return insertedView;
  }
  
  async updateBlogPostView(id: number, updates: Partial<InsertBlogPostView> & { lastActivityAt?: Date }): Promise<BlogPostView> {
    const now = new Date();
    const [updatedView] = await db
      .update(blogPostViews)
      .set({
        ...updates,
        lastActivityAt: now,
      })
      .where(eq(blogPostViews.id, id))
      .returning();
    return updatedView;
  }
  
  async getBlogPostViews(postId: number): Promise<BlogPostView[]> {
    return db
      .select()
      .from(blogPostViews)
      .where(eq(blogPostViews.postId, postId))
      .orderBy(desc(blogPostViews.viewedAt));
  }
  
  async getBlogPostAnalytics(postId: number): Promise<{
    totalViews: number;
    uniqueViews: number;
    averageScrollDepth: number;
    averageTimeSpent: number;
    completionRate: number;
  }> {
    const views = await this.getBlogPostViews(postId);
    
    const uniqueSessions = new Set(views.map(v => v.sessionId));
    const completedViews = views.filter(v => v.readComplete);
    
    const totalScrollDepth = views.reduce((sum, v) => sum + (v.maxScrollDepth || 0), 0);
    const totalTimeSpent = views.reduce((sum, v) => sum + (v.timeSpent || 0), 0);
    
    return {
      totalViews: views.length,
      uniqueViews: uniqueSessions.size,
      averageScrollDepth: views.length > 0 ? Math.round(totalScrollDepth / views.length) : 0,
      averageTimeSpent: views.length > 0 ? Math.round(totalTimeSpent / views.length) : 0,
      completionRate: views.length > 0 ? Math.round((completedViews.length / views.length) * 100) : 0,
    };
  }
  
  async incrementBlogPostViewCount(postId: number): Promise<BlogPost> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));
    
    if (!post) {
      throw new Error(`Blog post with id ${postId} not found`);
    }
    
    const [updatedPost] = await db
      .update(blogPosts)
      .set({
        viewCount: (post.viewCount || 0) + 1,
      })
      .where(eq(blogPosts.id, postId))
      .returning();
    
    return updatedPost;
  }
  
  // Newsletter subscriber operations
  async createSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [inserted] = await db
      .insert(newsletterSubscribers)
      .values({
        ...subscriber,
        subscribed: subscriber.subscribed ?? true,
        subscribedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          subscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      })
      .returning();
    return inserted;
  }
  
  async getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);
    return subscriber || undefined;
  }
  
  async getAllSubscribers(includeUnsubscribed: boolean = false): Promise<NewsletterSubscriber[]> {
    if (includeUnsubscribed) {
      return db
        .select()
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.subscribedAt));
    }
    return db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.subscribed, true))
      .orderBy(desc(newsletterSubscribers.subscribedAt));
  }
  
  async updateSubscriber(id: number, updates: Partial<InsertNewsletterSubscriber> & { unsubscribedAt?: Date | null; subscribedAt?: Date | null }): Promise<NewsletterSubscriber> {
    const updateData: any = { ...updates };
    if (updates.subscribed === false && !updates.unsubscribedAt) {
      updateData.unsubscribedAt = new Date();
    } else if (updates.subscribed === true) {
      updateData.unsubscribedAt = null;
      updateData.subscribedAt = new Date();
    }
    
    const [updated] = await db
      .update(newsletterSubscribers)
      .set(updateData)
      .where(eq(newsletterSubscribers.id, id))
      .returning();
    return updated;
  }
  
  async unsubscribeSubscriber(id: number): Promise<NewsletterSubscriber> {
    return this.updateSubscriber(id, {
      subscribed: false,
      unsubscribedAt: new Date(),
    });
  }
  
  async deleteSubscriber(id: number): Promise<void> {
    await db
      .delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id));
  }
  
  // Newsletter operations
  async createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
    const now = new Date();
    const [inserted] = await db
      .insert(newsletters)
      .values({
        ...newsletter,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return inserted;
  }
  
  async getNewsletterById(id: number): Promise<Newsletter | undefined> {
    const [newsletter] = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.id, id))
      .limit(1);
    return newsletter || undefined;
  }
  
  async getAllNewsletters(): Promise<Newsletter[]> {
    return db
      .select()
      .from(newsletters)
      .orderBy(desc(newsletters.createdAt));
  }
  
  async updateNewsletter(id: number, updates: Partial<InsertNewsletter> & { sentAt?: Date; scheduledAt?: Date; updatedAt?: Date; sentCount?: number; failedCount?: number; deliveredCount?: number; openedCount?: number; clickedCount?: number; totalRecipients?: number }): Promise<Newsletter> {
    const [updated] = await db
      .update(newsletters)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(newsletters.id, id))
      .returning();
    return updated;
  }
  
  async deleteNewsletter(id: number): Promise<void> {
    await db
      .delete(newsletters)
      .where(eq(newsletters.id, id));
  }
  
  // Newsletter send operations
  async createNewsletterSend(send: InsertNewsletterSend): Promise<NewsletterSend> {
    const [inserted] = await db
      .insert(newsletterSends)
      .values(send)
      .returning();
    return inserted;
  }
  
  async updateNewsletterSend(id: number, updates: Partial<InsertNewsletterSend> & { sentAt?: Date; deliveredAt?: Date; openedAt?: Date; clickedAt?: Date; failedAt?: Date }): Promise<NewsletterSend> {
    const [updated] = await db
      .update(newsletterSends)
      .set(updates)
      .where(eq(newsletterSends.id, id))
      .returning();
    return updated;
  }
  
  async getNewsletterSends(newsletterId: number): Promise<NewsletterSend[]> {
    return db
      .select()
      .from(newsletterSends)
      .where(eq(newsletterSends.newsletterId, newsletterId))
      .orderBy(desc(newsletterSends.sentAt));
  }
  
  async getSubscriberSends(subscriberId: number): Promise<NewsletterSend[]> {
    return db
      .select()
      .from(newsletterSends)
      .where(eq(newsletterSends.subscriberId, subscriberId))
      .orderBy(desc(newsletterSends.sentAt));
  }

  async getOrCreateSubscriberForEmail(email: string, source: string = "manual"): Promise<NewsletterSubscriber> {
    const existing = await this.getSubscriberByEmail(email);
    if (existing) return existing;
    return this.createSubscriber({
      email: email.trim().toLowerCase(),
      name: null,
      subscribed: true,
      source,
    });
  }
  
  // Client dashboard operations
  async getClientQuotes(userId: number): Promise<ClientQuote[]> {
    return db
      .select()
      .from(clientQuotes)
      .where(eq(clientQuotes.userId, userId))
      .orderBy(desc(clientQuotes.createdAt));
  }

  async getClientQuoteById(id: number, userId: number): Promise<ClientQuote | undefined> {
    const [quote] = await db
      .select()
      .from(clientQuotes)
      .where(and(eq(clientQuotes.id, id), eq(clientQuotes.userId, userId)))
      .limit(1);
    return quote || undefined;
  }

  async updateClientQuoteStatus(id: number, userId: number, status: "accepted" | "rejected", paymentPlan?: string | null): Promise<ClientQuote> {
    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (paymentPlan != null) (updates as any).paymentPlan = paymentPlan;
    const [updated] = await db
      .update(clientQuotes)
      .set(updates as any)
      .where(and(eq(clientQuotes.id, id), eq(clientQuotes.userId, userId)))
      .returning();
    if (!updated) throw new Error("Quote not found or access denied");
    return updated;
  }

  /** Get quotes for a client by their email (match assessment email). Use when client has no userId on quote. */
  async getClientQuotesByEmail(clientEmail: string): Promise<ClientQuote[]> {
    const rows = await db
      .select({ quote: clientQuotes })
      .from(clientQuotes)
      .innerJoin(projectAssessments, eq(clientQuotes.assessmentId, projectAssessments.id))
      .where(eq(projectAssessments.email, clientEmail))
      .orderBy(desc(clientQuotes.createdAt));
    return rows.map((r) => r.quote);
  }

  /** Get one quote by id if the assessment belongs to this client email. */
  async getClientQuoteByIdForEmail(quoteId: number, clientEmail: string): Promise<ClientQuote | undefined> {
    const rows = await db
      .select({ quote: clientQuotes })
      .from(clientQuotes)
      .innerJoin(projectAssessments, eq(clientQuotes.assessmentId, projectAssessments.id))
      .where(and(eq(clientQuotes.id, quoteId), eq(projectAssessments.email, clientEmail)))
      .limit(1);
    return rows[0]?.quote ?? undefined;
  }

  /** Update quote status (approve/reject) when client is identified by email. */
  async updateClientQuoteStatusByEmail(quoteId: number, clientEmail: string, status: "accepted" | "rejected", paymentPlan?: string | null): Promise<ClientQuote> {
    const quote = await this.getClientQuoteByIdForEmail(quoteId, clientEmail);
    if (!quote) throw new Error("Quote not found or access denied");
    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (paymentPlan != null) (updates as any).paymentPlan = paymentPlan;
    const [updated] = await db
      .update(clientQuotes)
      .set(updates as any)
      .where(eq(clientQuotes.id, quoteId))
      .returning();
    if (!updated) throw new Error("Quote not found or access denied");
    return updated;
  }

  /** Get quote by secure view token (for link-based access). */
  async getClientQuoteByViewToken(token: string): Promise<ClientQuote | undefined> {
    const [quote] = await db
      .select()
      .from(clientQuotes)
      .where(eq(clientQuotes.viewToken, token))
      .limit(1);
    return quote ?? undefined;
  }

  async createClientQuote(values: InsertClientQuote & { viewToken?: string | null }): Promise<ClientQuote> {
    const [inserted] = await db
      .insert(clientQuotes)
      .values({
        ...values,
        viewToken: values.viewToken ?? null,
      })
      .returning();
    return inserted;
  }
  
  async getClientInvoices(userId: number): Promise<ClientInvoice[]> {
    return db
      .select()
      .from(clientInvoices)
      .where(eq(clientInvoices.userId, userId))
      .orderBy(desc(clientInvoices.createdAt));
  }

  /** Quote IDs for this user that are approved and active in development (so we can filter announcements). */
  async getActiveProjectQuoteIdsForUser(userId: number): Promise<number[]> {
    const user = await this.getUser(userId);
    const activeStatuses = ["accepted", "in_development"];
    const byUserId = await db
      .select({ id: clientQuotes.id })
      .from(clientQuotes)
      .where(
        and(
          eq(clientQuotes.userId, userId),
          inArray(clientQuotes.status, activeStatuses)
        )
      );
    const ids = new Set(byUserId.map((r) => r.id));
    if (user?.email) {
      const byEmail = await db
        .select({ id: clientQuotes.id })
        .from(clientQuotes)
        .innerJoin(projectAssessments, eq(clientQuotes.assessmentId, projectAssessments.id))
        .where(
          and(
            eq(projectAssessments.email, user.email),
            inArray(clientQuotes.status, activeStatuses)
          )
        );
      byEmail.forEach((r) => ids.add(r.id));
    }
    return Array.from(ids);
  }
  
  /** Announcements only for this client's approved projects that are active in development (or all / user-targeted). */
  async getClientAnnouncements(userId: number): Promise<ClientAnnouncement[]> {
    const now = new Date();
    const activeQuoteIds = await this.getActiveProjectQuoteIdsForUser(userId);
    const rows = await db
      .select()
      .from(clientAnnouncements)
      .where(
        and(
          eq(clientAnnouncements.isActive, true),
          sql`(expires_at IS NULL OR expires_at > ${now})`,
          sql`(
            target_audience = 'all'
            OR (target_user_ids IS NOT NULL AND target_user_ids @> ${JSON.stringify([userId])}::jsonb)
            OR (target_project_ids IS NOT NULL AND target_project_ids != '[]'::jsonb AND target_project_ids && ${JSON.stringify(activeQuoteIds)}::jsonb)
          )`
        )
      )
      .orderBy(desc(clientAnnouncements.createdAt));
    return rows;
  }
  
  async getClientFeedback(userId: number): Promise<ClientFeedback[]> {
    return db
      .select()
      .from(clientFeedback)
      .where(eq(clientFeedback.userId, userId))
      .orderBy(desc(clientFeedback.createdAt));
  }
  
  async createClientFeedback(feedback: InsertClientFeedback): Promise<ClientFeedback> {
    const [inserted] = await db
      .insert(clientFeedback)
      .values(feedback)
      .returning();
    return inserted;
  }
  
  async getClientProjects(userId: number): Promise<ProjectAssessment[]> {
    // Get user by ID first to get email
    const user = await this.getUser(userId);
    if (!user || !user.email) {
      return [];
    }
    
    // Get assessments by email
    return db
      .select()
      .from(projectAssessments)
      .where(eq(projectAssessments.email, user.email))
      .orderBy(desc(projectAssessments.createdAt));
  }
  
  async getAllClientFeedback(): Promise<ClientFeedback[]> {
    return db
      .select()
      .from(clientFeedback)
      .orderBy(desc(clientFeedback.createdAt));
  }
  
  async updateClientFeedback(id: number, updates: Partial<InsertClientFeedback> & { respondedBy?: number; respondedAt?: Date }): Promise<ClientFeedback> {
    const [updated] = await db
      .update(clientFeedback)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(clientFeedback.id, id))
      .returning();
    return updated;
  }

  async getAllInvoices(): Promise<ClientInvoice[]> {
    return db
      .select()
      .from(clientInvoices)
      .orderBy(desc(clientInvoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<ClientInvoice | undefined> {
    const [row] = await db.select().from(clientInvoices).where(eq(clientInvoices.id, id));
    return row || undefined;
  }

  async getInvoiceByStripeId(stripeInvoiceId: string): Promise<ClientInvoice | undefined> {
    const [row] = await db.select().from(clientInvoices).where(eq(clientInvoices.stripeInvoiceId, stripeInvoiceId));
    return row || undefined;
  }

  async createInvoice(invoice: InsertClientInvoice): Promise<ClientInvoice> {
    const [inserted] = await db.insert(clientInvoices).values(invoice).returning();
    return inserted;
  }

  async updateInvoice(id: number, updates: Partial<InsertClientInvoice> & { paidAt?: Date | null; lastReminderAt?: Date | null }): Promise<ClientInvoice> {
    const [updated] = await db
      .update(clientInvoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clientInvoices.id, id))
      .returning();
    return updated;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(clientInvoices).where(eq(clientInvoices.id, id));
  }

  async getAllAnnouncements(): Promise<ClientAnnouncement[]> {
    return db
      .select()
      .from(clientAnnouncements)
      .orderBy(desc(clientAnnouncements.createdAt));
  }

  async getPublicAnnouncements(): Promise<ClientAnnouncement[]> {
    const now = new Date();
    return db
      .select()
      .from(clientAnnouncements)
      .where(
        and(
          eq(clientAnnouncements.isActive, true),
          eq(clientAnnouncements.targetAudience, "all"),
          sql`(expires_at IS NULL OR expires_at > ${now})`
        )
      )
      .orderBy(desc(clientAnnouncements.createdAt));
  }

  async getAnnouncementById(id: number): Promise<ClientAnnouncement | undefined> {
    const [row] = await db.select().from(clientAnnouncements).where(eq(clientAnnouncements.id, id));
    return row || undefined;
  }

  async createAnnouncement(announcement: Omit<InsertClientAnnouncement, "id">): Promise<ClientAnnouncement> {
    const [inserted] = await db
      .insert(clientAnnouncements)
      .values(announcement as typeof clientAnnouncements.$inferInsert)
      .returning();
    if (!inserted) {
      throw new Error("Announcement insert did not return a row");
    }
    return inserted;
  }

  async updateAnnouncement(id: number, updates: Partial<InsertClientAnnouncement>): Promise<ClientAnnouncement> {
    const [updated] = await db
      .update(clientAnnouncements)
      .set(updates)
      .where(eq(clientAnnouncements.id, id))
      .returning();
    return updated;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(clientAnnouncements).where(eq(clientAnnouncements.id, id));
  }

  // CRM implementation
  async getCrmContacts(type?: "lead" | "client"): Promise<CrmContact[]> {
    if (type) {
      return db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.type, type))
        .orderBy(desc(crmContacts.updatedAt));
    }
    return db.select().from(crmContacts).orderBy(desc(crmContacts.updatedAt));
  }

  async getCrmContactById(id: number): Promise<CrmContact | undefined> {
    const [row] = await db.select().from(crmContacts).where(eq(crmContacts.id, id));
    return row || undefined;
  }

  async createCrmContact(contact: InsertCrmContact): Promise<CrmContact> {
    const now = new Date();
    const [inserted] = await db
      .insert(crmContacts)
      .values({ ...contact, createdAt: now, updatedAt: now })
      .returning();
    return inserted;
  }

  async updateCrmContact(id: number, updates: Partial<InsertCrmContact>): Promise<CrmContact> {
    const [updated] = await db
      .update(crmContacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmContacts.id, id))
      .returning();
    return updated;
  }

  async deleteCrmContact(id: number): Promise<void> {
    await db.delete(crmContacts).where(eq(crmContacts.id, id));
  }

  async getCrmDeals(contactId?: number): Promise<(CrmDeal & { contact?: CrmContact })[]> {
    if (contactId) {
      const deals = await db
        .select()
        .from(crmDeals)
        .where(eq(crmDeals.contactId, contactId))
        .orderBy(desc(crmDeals.updatedAt));
      const contact = await this.getCrmContactById(contactId);
      return deals.map((d) => ({ ...d, contact: contact || undefined }));
    }
    const deals = await db.select().from(crmDeals).orderBy(desc(crmDeals.updatedAt));
    const contactIds = [...new Set(deals.map((d) => d.contactId))];
    const contacts = await Promise.all(contactIds.map((id) => this.getCrmContactById(id)));
    const byId = Object.fromEntries(contactIds.map((id, i) => [id, contacts[i]]));
    return deals.map((d) => ({ ...d, contact: byId[d.contactId] }));
  }

  async getCrmDealById(id: number): Promise<CrmDeal | undefined> {
    const [row] = await db.select().from(crmDeals).where(eq(crmDeals.id, id));
    return row || undefined;
  }

  async createCrmDeal(deal: InsertCrmDeal): Promise<CrmDeal> {
    const now = new Date();
    const [inserted] = await db
      .insert(crmDeals)
      .values({ ...deal, createdAt: now, updatedAt: now })
      .returning();
    return inserted;
  }

  async updateCrmDeal(id: number, updates: Partial<InsertCrmDeal>): Promise<CrmDeal> {
    const [updated] = await db
      .update(crmDeals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmDeals.id, id))
      .returning();
    return updated;
  }

  async deleteCrmDeal(id: number): Promise<void> {
    await db.delete(crmDeals).where(eq(crmDeals.id, id));
  }

  async getCrmActivities(contactId: number): Promise<CrmActivity[]> {
    return db
      .select()
      .from(crmActivities)
      .where(eq(crmActivities.contactId, contactId))
      .orderBy(desc(crmActivities.createdAt));
  }

  async createCrmActivity(activity: InsertCrmActivity): Promise<CrmActivity> {
    const [inserted] = await db.insert(crmActivities).values(activity).returning();
    return inserted;
  }

  async getCrmContactsByEmails(emails: string[]): Promise<CrmContact[]> {
    if (emails.length === 0) return [];
    return db
      .select()
      .from(crmContacts)
      .where(inArray(crmContacts.email, emails));
  }

  async createCommunicationEvent(event: InsertCommunicationEvent): Promise<CommunicationEvent> {
    const [inserted] = await db.insert(communicationEvents).values(event).returning();
    return inserted;
  }

  async getCommunicationEventsByLeadId(leadId: number): Promise<CommunicationEvent[]> {
    return db
      .select()
      .from(communicationEvents)
      .where(eq(communicationEvents.leadId, leadId))
      .orderBy(desc(communicationEvents.createdAt));
  }

  async upsertDocumentEvent(data: {
    documentId: string;
    documentType: string;
    leadId: number | null;
    quoteId: number | null;
    viewTimeSeconds?: number;
    eventDetail: string;
    deviceType?: string | null;
    location?: string | null;
  }): Promise<DocumentEvent> {
    const now = new Date();
    const existing = data.leadId != null
      ? await db
          .select()
          .from(documentEvents)
          .where(
            and(
              eq(documentEvents.documentId, data.documentId),
              eq(documentEvents.leadId, data.leadId)
            )
          )
          .limit(1)
      : await db
          .select()
          .from(documentEvents)
          .where(
            and(
              eq(documentEvents.documentId, data.documentId),
              isNull(documentEvents.leadId)
            )
          )
          .limit(1);
    const addTime = data.viewTimeSeconds ?? 0;
    if (existing.length > 0) {
      const row = existing[0];
      const [updated] = await db
        .update(documentEvents)
        .set({
          viewCount: row.viewCount + 1,
          lastViewedAt: now,
          totalViewTimeSeconds: (row.totalViewTimeSeconds ?? 0) + addTime,
          lastEventDetail: data.eventDetail,
          deviceType: data.deviceType ?? row.deviceType,
          location: data.location ?? row.location,
          updatedAt: now,
        })
        .where(eq(documentEvents.id, row.id))
        .returning();
      await db.insert(documentEventLog).values({
        documentEventId: updated!.id,
        documentId: data.documentId,
        documentType: data.documentType,
        leadId: data.leadId,
        quoteId: data.quoteId,
        eventDetail: data.eventDetail,
        viewTimeSeconds: data.viewTimeSeconds ?? null,
        deviceType: data.deviceType,
      });
      return updated!;
    }
    const [inserted] = await db
      .insert(documentEvents)
      .values({
        documentId: data.documentId,
        documentType: data.documentType,
        leadId: data.leadId,
        quoteId: data.quoteId,
        viewCount: 1,
        firstViewedAt: now,
        lastViewedAt: now,
        totalViewTimeSeconds: addTime,
        lastEventDetail: data.eventDetail,
        deviceType: data.deviceType,
        location: data.location,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await db.insert(documentEventLog).values({
      documentEventId: inserted!.id,
      documentId: data.documentId,
      documentType: data.documentType,
      leadId: data.leadId,
      quoteId: data.quoteId,
      eventDetail: data.eventDetail,
      viewTimeSeconds: data.viewTimeSeconds ?? null,
      deviceType: data.deviceType,
    });
    return inserted!;
  }

  async getDocumentEventsByLeadId(leadId: number): Promise<DocumentEvent[]> {
    return db
      .select()
      .from(documentEvents)
      .where(eq(documentEvents.leadId, leadId))
      .orderBy(desc(documentEvents.lastViewedAt));
  }

  async getDocumentEventLogByLeadId(leadId: number): Promise<{ id: number; documentId: string; documentType: string; eventDetail: string; viewTimeSeconds: number | null; createdAt: Date }[]> {
    const rows = await db
      .select({
        id: documentEventLog.id,
        documentId: documentEventLog.documentId,
        documentType: documentEventLog.documentType,
        eventDetail: documentEventLog.eventDetail,
        viewTimeSeconds: documentEventLog.viewTimeSeconds,
        createdAt: documentEventLog.createdAt,
      })
      .from(documentEventLog)
      .where(eq(documentEventLog.leadId, leadId))
      .orderBy(desc(documentEventLog.createdAt));
    return rows;
  }

  async createVisitorActivity(activity: InsertVisitorActivity): Promise<VisitorActivity> {
    const [inserted] = await db.insert(visitorActivity).values(activity).returning();
    return inserted;
  }

  async attachVisitorToLead(visitorId: string, leadId: number): Promise<void> {
    await db
      .update(visitorActivity)
      .set({ leadId })
      .where(eq(visitorActivity.visitorId, visitorId));
  }

  async getVisitorActivityByLeadId(leadId: number): Promise<VisitorActivity[]> {
    return db
      .select()
      .from(visitorActivity)
      .where(eq(visitorActivity.leadId, leadId))
      .orderBy(desc(visitorActivity.createdAt));
  }

  async createCrmAlert(alert: InsertCrmAlert): Promise<CrmAlert> {
    const [inserted] = await db.insert(crmAlerts).values(alert).returning();
    return inserted;
  }

  async getCrmAlerts(leadId?: number, unreadOnly?: boolean): Promise<(CrmAlert & { lead?: CrmContact })[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (leadId !== undefined) conditions.push(eq(crmAlerts.leadId, leadId));
    if (unreadOnly) conditions.push(isNull(crmAlerts.readAt));
    const alerts = conditions.length
      ? await db.select().from(crmAlerts).where(and(...conditions)).orderBy(desc(crmAlerts.createdAt))
      : await db.select().from(crmAlerts).orderBy(desc(crmAlerts.createdAt));
    const contactIds = [...new Set(alerts.map((a) => a.leadId))];
    const contacts = await Promise.all(contactIds.map((id) => this.getCrmContactById(id)));
    const byId = Object.fromEntries(contactIds.map((id, i) => [id, contacts[i]]));
    return alerts.map((a) => ({ ...a, lead: byId[a.leadId] }));
  }

  async markCrmAlertRead(id: number): Promise<void> {
    await db.update(crmAlerts).set({ readAt: new Date() }).where(eq(crmAlerts.id, id));
  }

  async getCrmContactIdByQuoteId(quoteId: number): Promise<number | null> {
    const [quote] = await db.select().from(clientQuotes).where(eq(clientQuotes.id, quoteId)).limit(1);
    if (!quote?.assessmentId) return null;
    const [assess] = await db
      .select({ email: projectAssessments.email })
      .from(projectAssessments)
      .where(eq(projectAssessments.id, quote.assessmentId))
      .limit(1);
    if (!assess?.email) return null;
    const contacts = await this.getCrmContactsByEmails([assess.email]);
    return contacts[0]?.id ?? null;
  }

  async getCrmEngagementStats(): Promise<{
    emailOpens: number;
    emailClicks: number;
    documentViews: number;
    highIntentLeadsCount: number;
    unreadAlertsCount: number;
  }> {
    const [opens] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communicationEvents)
      .where(eq(communicationEvents.eventType, "open"));
    const [clicks] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communicationEvents)
      .where(eq(communicationEvents.eventType, "click"));
    const [docViews] = await db
      .select({ total: sql<number>`coalesce(sum(${documentEvents.viewCount}), 0)::int` })
      .from(documentEvents);
    const contacts = await this.getCrmContacts();
    const highIntentLeadsCount = contacts.filter(
      (c) => c.intentLevel === "high_intent" || c.intentLevel === "hot_lead"
    ).length;
    const alerts = await this.getCrmAlerts(undefined, true);
    return {
      emailOpens: opens?.count ?? 0,
      emailClicks: clicks?.count ?? 0,
      documentViews: docViews?.total ?? 0,
      highIntentLeadsCount,
      unreadAlertsCount: alerts.length,
    };
  }

  async createCrmTask(task: InsertCrmTask): Promise<CrmTask> {
    const now = new Date();
    const [inserted] = await db.insert(crmTasks).values({ ...task, createdAt: now, updatedAt: now }).returning();
    return inserted!;
  }

  async updateCrmTask(id: number, updates: Partial<InsertCrmTask>): Promise<CrmTask> {
    const [updated] = await db.update(crmTasks).set({ ...updates, updatedAt: new Date() }).where(eq(crmTasks.id, id)).returning();
    if (!updated) throw new Error("Task not found");
    return updated;
  }

  async deleteCrmTask(id: number): Promise<void> {
    await db.delete(crmTasks).where(eq(crmTasks.id, id));
  }

  async getCrmTasksByContactId(contactId: number): Promise<CrmTask[]> {
    return db.select().from(crmTasks).where(eq(crmTasks.contactId, contactId)).orderBy(desc(crmTasks.dueAt));
  }

  async getCrmTasks(filters: { contactId?: number; overdueOnly?: boolean; incompleteOnly?: boolean }): Promise<(CrmTask & { contact?: CrmContact })[]> {
    const conditions = [];
    if (filters.contactId != null) conditions.push(eq(crmTasks.contactId, filters.contactId));
    if (filters.overdueOnly) conditions.push(and(isNull(crmTasks.completedAt), isNotNull(crmTasks.dueAt), lt(crmTasks.dueAt, new Date()))!);
    if (filters.incompleteOnly) conditions.push(isNull(crmTasks.completedAt));
    const rows = await db
      .select()
      .from(crmTasks)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(crmTasks.dueAt));
    const contactIds = [...new Set(rows.map((r) => r.contactId))];
    const contacts = await Promise.all(contactIds.map((id) => this.getCrmContactById(id)));
    const byId = Object.fromEntries(contactIds.map((id, i) => [id, contacts[i]]));
    return rows.map((r) => ({ ...r, contact: byId[r.contactId] }));
  }

  async createCrmSequence(seq: InsertCrmSequence): Promise<CrmSequence> {
    const now = new Date();
    const [inserted] = await db.insert(crmSequences).values({ ...seq, createdAt: now, updatedAt: now }).returning();
    return inserted!;
  }

  async getCrmSequences(): Promise<CrmSequence[]> {
    return db.select().from(crmSequences).orderBy(desc(crmSequences.updatedAt));
  }

  async getCrmSequenceById(id: number): Promise<CrmSequence | undefined> {
    const [row] = await db.select().from(crmSequences).where(eq(crmSequences.id, id)).limit(1);
    return row ?? undefined;
  }

  async updateCrmSequence(id: number, updates: Partial<InsertCrmSequence>): Promise<CrmSequence> {
    const [updated] = await db.update(crmSequences).set({ ...updates, updatedAt: new Date() }).where(eq(crmSequences.id, id)).returning();
    if (!updated) throw new Error("Sequence not found");
    return updated;
  }

  async createCrmSequenceEnrollment(enrollment: InsertCrmSequenceEnrollment): Promise<CrmSequenceEnrollment> {
    const now = new Date();
    const [inserted] = await db.insert(crmSequenceEnrollments).values({ ...enrollment, createdAt: now, updatedAt: now }).returning();
    return inserted!;
  }

  async getCrmSequenceEnrollments(contactId?: number, sequenceId?: number): Promise<(CrmSequenceEnrollment & { contact?: CrmContact; sequence?: CrmSequence })[]> {
    const conditions = [];
    if (contactId != null) conditions.push(eq(crmSequenceEnrollments.contactId, contactId));
    if (sequenceId != null) conditions.push(eq(crmSequenceEnrollments.sequenceId, sequenceId));
    const rows = await db
      .select()
      .from(crmSequenceEnrollments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(crmSequenceEnrollments.enrolledAt));
    const cIds = [...new Set(rows.map((r) => r.contactId))];
    const sIds = [...new Set(rows.map((r) => r.sequenceId))];
    const contacts = await Promise.all(cIds.map((id) => this.getCrmContactById(id)));
    const sequences = await Promise.all(sIds.map((id) => this.getCrmSequenceById(id)));
    const contactById = Object.fromEntries(cIds.map((id, i) => [id, contacts[i]]));
    const sequenceById = Object.fromEntries(sIds.map((id, i) => [id, sequences[i]]));
    return rows.map((r) => ({ ...r, contact: contactById[r.contactId], sequence: sequenceById[r.sequenceId] }));
  }

  async updateCrmSequenceEnrollment(id: number, updates: Partial<InsertCrmSequenceEnrollment>): Promise<CrmSequenceEnrollment> {
    const [updated] = await db
      .update(crmSequenceEnrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmSequenceEnrollments.id, id))
      .returning();
    if (!updated) throw new Error("Enrollment not found");
    return updated;
  }

  async createCrmSavedList(list: InsertCrmSavedList): Promise<CrmSavedList> {
    const now = new Date();
    const [inserted] = await db.insert(crmSavedLists).values({ ...list, createdAt: now, updatedAt: now }).returning();
    return inserted!;
  }

  async getCrmSavedLists(): Promise<CrmSavedList[]> {
    return db.select().from(crmSavedLists).orderBy(desc(crmSavedLists.updatedAt));
  }

  async getCrmSavedListById(id: number): Promise<CrmSavedList | undefined> {
    const [row] = await db.select().from(crmSavedLists).where(eq(crmSavedLists.id, id)).limit(1);
    return row ?? undefined;
  }

  async updateCrmSavedList(id: number, updates: Partial<InsertCrmSavedList>): Promise<CrmSavedList> {
    const [updated] = await db.update(crmSavedLists).set({ ...updates, updatedAt: new Date() }).where(eq(crmSavedLists.id, id)).returning();
    if (!updated) throw new Error("Saved list not found");
    return updated;
  }

  async deleteCrmSavedList(id: number): Promise<void> {
    await db.delete(crmSavedLists).where(eq(crmSavedLists.id, id));
  }

  async getCrmContactsBySavedListFilters(filters: NonNullable<CrmSavedList["filters"]>): Promise<CrmContact[]> {
    let contacts = await this.getCrmContacts();
    if (filters.type) contacts = contacts.filter((c) => c.type === filters.type);
    if (filters.status) contacts = contacts.filter((c) => c.status === filters.status);
    if (filters.intentLevel) contacts = contacts.filter((c) => c.intentLevel === filters.intentLevel);
    if (filters.source) contacts = contacts.filter((c) => c.source === filters.source);
    if (filters.noContactSinceDays != null) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.noContactSinceDays);
      contacts = contacts.filter((c) => {
        const u = c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt as string);
        return u < cutoff;
      });
    }
    if (filters.hasOpenTasks) {
      const taskRows = await db.select({ contactId: crmTasks.contactId }).from(crmTasks).where(isNull(crmTasks.completedAt));
      const withTasks = new Set(taskRows.map((t) => t.contactId));
      contacts = contacts.filter((c) => withTasks.has(c.id));
    }
    return contacts;
  }
}

export const storage = new DatabaseStorage();
