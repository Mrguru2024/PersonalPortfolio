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
  funnelContent, type FunnelContent, type InsertFunnelContent,
  siteOffers, type SiteOffer, type InsertSiteOffer,
  businessGoalPresets, type BusinessGoalPreset, type InsertBusinessGoalPreset,
  adminReminders, type AdminReminder, type InsertAdminReminder,
  adminSettings, type AdminSettings, type InsertAdminSettings,
} from "@shared/schema";
import { blogPostViews, type BlogPostView, type InsertBlogPostView } from "@shared/blogAnalyticsSchema";
import {
  newsletterSubscribers, type NewsletterSubscriber, type InsertNewsletterSubscriber,
  newsletters, type Newsletter, type InsertNewsletter,
  newsletterSends, type NewsletterSend, type InsertNewsletterSend
} from "@shared/newsletterSchema";
import {
  crmAccounts, type CrmAccount, type InsertCrmAccount,
  crmContacts, type CrmContact, type InsertCrmContact,
  crmDeals, type CrmDeal, type InsertCrmDeal,
  crmActivities, type CrmActivity, type InsertCrmActivity,
  crmActivityLog, type CrmActivityLog, type InsertCrmActivityLog,
  crmResearchProfiles, type CrmResearchProfile, type InsertCrmResearchProfile,
  communicationEvents, type CommunicationEvent, type InsertCommunicationEvent,
  documentEvents, documentEventLog, type DocumentEvent, type InsertDocumentEvent, type InsertDocumentEventLog,
  visitorActivity, type VisitorActivity, type InsertVisitorActivity,
  crmAlerts, type CrmAlert, type InsertCrmAlert,
  leadScoreEvents, type LeadScoreEvent, type InsertLeadScoreEvent,
  crmTasks, type CrmTask, type InsertCrmTask,
  crmSequences, type CrmSequence, type InsertCrmSequence,
  crmSequenceEnrollments, type CrmSequenceEnrollment, type InsertCrmSequenceEnrollment,
  crmSavedLists, type CrmSavedList, type InsertCrmSavedList,
  crmAiGuidance, type CrmAiGuidance, type InsertCrmAiGuidance,
  crmWorkflowExecutions, type CrmWorkflowExecution, type InsertCrmWorkflowExecution,
  crmDiscoveryWorkspaces, type CrmDiscoveryWorkspace, type InsertCrmDiscoveryWorkspace,
  crmProposalPrepWorkspaces, type CrmProposalPrepWorkspace, type InsertCrmProposalPrepWorkspace,
  crmSalesPlaybooks, type CrmSalesPlaybook, type InsertCrmSalesPlaybook,
} from "@shared/crmSchema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, isNull, isNotNull, lt, or, gte, lte } from "drizzle-orm";
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

  getSiteOffer(slug: string): Promise<SiteOffer | undefined>;
  listSiteOffers(): Promise<SiteOffer[]>;
  setSiteOffer(slug: string, data: { name: string; metaTitle?: string | null; metaDescription?: string | null; sections: Record<string, unknown> }): Promise<SiteOffer>;

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
  getCrmContactsByAccountId(accountId: number): Promise<CrmContact[]>;
  getCrmContactById(id: number): Promise<CrmContact | undefined>;
  createCrmContact(contact: InsertCrmContact): Promise<CrmContact>;
  updateCrmContact(id: number, updates: Partial<InsertCrmContact>): Promise<CrmContact>;
  deleteCrmContact(id: number): Promise<void>;
  getCrmDeals(contactId?: number, accountId?: number, pipelineStage?: string): Promise<(CrmDeal & { contact?: CrmContact; account?: CrmAccount })[]>;
  getCrmDealById(id: number): Promise<(CrmDeal & { contact?: CrmContact; account?: CrmAccount }) | undefined>;
  createCrmDeal(deal: InsertCrmDeal): Promise<CrmDeal>;
  updateCrmDeal(id: number, updates: Partial<InsertCrmDeal>): Promise<CrmDeal>;
  deleteCrmDeal(id: number): Promise<void>;
  getCrmActivities(contactId: number): Promise<CrmActivity[]>;
  createCrmActivity(activity: InsertCrmActivity): Promise<CrmActivity>;
  getCrmContactsByEmails(emails: string[]): Promise<CrmContact[]>;

  // CRM accounts (Stage 1)
  getCrmAccounts(): Promise<CrmAccount[]>;
  getCrmAccountById(id: number): Promise<CrmAccount | undefined>;
  createCrmAccount(account: InsertCrmAccount): Promise<CrmAccount>;
  updateCrmAccount(id: number, updates: Partial<InsertCrmAccount>): Promise<CrmAccount>;
  deleteCrmAccount(id: number): Promise<void>;

  // CRM activity log (Stage 1)
  createCrmActivityLog(entry: InsertCrmActivityLog): Promise<CrmActivityLog>;
  getCrmActivityLogByContactId(contactId: number, limit?: number): Promise<CrmActivityLog[]>;
  getCrmActivityLogByAccountId(accountId: number, limit?: number): Promise<CrmActivityLog[]>;
  getCrmActivityLogByDealId(dealId: number, limit?: number): Promise<CrmActivityLog[]>;

  // CRM research profiles (Stage 1)
  getCrmResearchProfileByAccountId(accountId: number): Promise<CrmResearchProfile | undefined>;
  getCrmResearchProfiles(accountId?: number): Promise<CrmResearchProfile[]>;
  createCrmResearchProfile(profile: InsertCrmResearchProfile): Promise<CrmResearchProfile>;
  updateCrmResearchProfile(id: number, updates: Partial<InsertCrmResearchProfile>): Promise<CrmResearchProfile>;

  // CRM AI Guidance (Stage 3)
  createCrmAiGuidance(entry: InsertCrmAiGuidance): Promise<CrmAiGuidance>;
  getCrmAiGuidanceByEntity(entityType: string, entityId: number): Promise<CrmAiGuidance[]>;
  getCrmAiGuidanceByEntityAndType(entityType: string, entityId: number, outputType: string): Promise<CrmAiGuidance | undefined>;
  updateCrmAiGuidance(id: number, updates: Partial<Pick<InsertCrmAiGuidance, "content" | "providerType" | "version" | "generatedAt" | "staleAt" | "updatedAt">>): Promise<CrmAiGuidance>;

  // CRM workflow executions (Stage 4)
  createCrmWorkflowExecution(entry: InsertCrmWorkflowExecution): Promise<CrmWorkflowExecution>;
  getCrmWorkflowExecutionsByEntity(entityType: string, entityId: number, limit?: number): Promise<CrmWorkflowExecution[]>;

  // CRM Stage 3.5: Discovery workspace, proposal prep, playbook
  createCrmDiscoveryWorkspace(entry: InsertCrmDiscoveryWorkspace): Promise<CrmDiscoveryWorkspace>;
  getCrmDiscoveryWorkspaceById(id: number): Promise<CrmDiscoveryWorkspace | undefined>;
  getCrmDiscoveryWorkspacesByContactId(contactId: number): Promise<CrmDiscoveryWorkspace[]>;
  getCrmDiscoveryWorkspacesByDealId(dealId: number): Promise<CrmDiscoveryWorkspace[]>;
  updateCrmDiscoveryWorkspace(id: number, updates: Partial<InsertCrmDiscoveryWorkspace>): Promise<CrmDiscoveryWorkspace>;
  createCrmProposalPrepWorkspace(entry: InsertCrmProposalPrepWorkspace): Promise<CrmProposalPrepWorkspace>;
  getCrmProposalPrepWorkspaceById(id: number): Promise<CrmProposalPrepWorkspace | undefined>;
  getCrmProposalPrepWorkspacesByContactId(contactId: number): Promise<CrmProposalPrepWorkspace[]>;
  getCrmProposalPrepWorkspacesByDealId(dealId: number): Promise<CrmProposalPrepWorkspace[]>;
  updateCrmProposalPrepWorkspace(id: number, updates: Partial<InsertCrmProposalPrepWorkspace>): Promise<CrmProposalPrepWorkspace>;
  createCrmSalesPlaybook(entry: InsertCrmSalesPlaybook): Promise<CrmSalesPlaybook>;
  getCrmSalesPlaybookById(id: number): Promise<CrmSalesPlaybook | undefined>;
  getCrmSalesPlaybooks(activeOnly?: boolean): Promise<CrmSalesPlaybook[]>;
  updateCrmSalesPlaybook(id: number, updates: Partial<InsertCrmSalesPlaybook>): Promise<CrmSalesPlaybook>;

  // CRM dashboard (Stage 1)
  getCrmDashboardStats(): Promise<{
    totalContacts: number;
    totalAccounts: number;
    totalActiveLeads: number;
    leadsMissingData: number;
    proposalReadyCount: number;
    followUpNeededCount: number;
    sequenceReadyCount: number;
    leadsByPipelineStage: { stage: string; count: number }[];
    recentTasks: (CrmTask & { contact?: CrmContact })[];
    overdueTasks: (CrmTask & { contact?: CrmContact })[];
    recentActivity: CrmActivityLog[];
    accountsNeedingResearch: number;
    topSources: { source: string; count: number }[];
    topTags: { tag: string; count: number }[];
    discoveryWorkspacesIncomplete?: number;
    proposalPrepNeedingAttention?: number;
  }>;

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
  getVisitorActivityRecent(since?: Date, limit?: number): Promise<VisitorActivity[]>;

  // Lead intelligence: alerts
  createCrmAlert(alert: InsertCrmAlert): Promise<CrmAlert>;
  getCrmAlerts(leadId?: number, unreadOnly?: boolean): Promise<(CrmAlert & { lead?: CrmContact })[]>;
  markCrmAlertRead(id: number): Promise<void>;

  // Lead score history
  createLeadScoreEvent(event: InsertLeadScoreEvent): Promise<LeadScoreEvent>;
  getLeadScoreEventsByLeadId(leadId: number): Promise<LeadScoreEvent[]>;

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

  // Website analytics (traffic + lead magnets) for admin/super admin
  getWebsiteTrafficAnalytics(since?: Date): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    byPage: { page: string; count: number; unique: number }[];
    byEventType: { eventType: string; count: number }[];
    byDevice: { device: string; count: number }[];
    byReferrer: { referrer: string; count: number }[];
    byCountry: { country: string; count: number; unique: number }[];
    byRegion: { region: string; country: string; count: number }[];
    byCity: { city: string; region: string; country: string; count: number }[];
    byTimezone: { timezone: string; count: number }[];
    byUtmSource: { value: string; count: number }[];
    byUtmMedium: { value: string; count: number }[];
    byUtmCampaign: { value: string; count: number }[];
  }>;
  getVisitorActivityFiltered(filters: {
    since?: Date;
    until?: Date;
    eventType?: string;
    page?: string;
    deviceType?: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    experimentKey?: string;
    experimentVariant?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: VisitorActivity[]; total: number }>;
  getLeadMagnetPerformance(since?: Date): Promise<{
    totalLeads: number;
    bySource: { source: string; label: string; count: number }[];
    recentCount: number;
  }>;
  getLeadDemographics(since?: Date): Promise<{
    byAgeRange: { value: string; count: number }[];
    byGender: { value: string; count: number }[];
    byOccupation: { value: string; count: number }[];
    byCompanySize: { value: string; count: number }[];
    byIndustry: { value: string; count: number }[];
    totalWithDemographics: number;
    sources: string[];
  }>;

  // Tasks (Apollo-style)
  createCrmTask(task: InsertCrmTask): Promise<CrmTask>;
  updateCrmTask(id: number, updates: Partial<InsertCrmTask>): Promise<CrmTask>;
  deleteCrmTask(id: number): Promise<void>;
  getCrmTasksByContactId(contactId: number): Promise<CrmTask[]>;
  getCrmTasks(filters: { contactId?: number; relatedDealId?: number; relatedAccountId?: number; overdueOnly?: boolean; incompleteOnly?: boolean }): Promise<(CrmTask & { contact?: CrmContact })[]>;

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

  // Business goal presets & admin reminders
  getBusinessGoalPresets(activeOnly?: boolean): Promise<BusinessGoalPreset[]>;
  getAdminReminders(filters: { userId?: number | null; status?: string; includeSnoozedDue?: boolean }): Promise<AdminReminder[]>;
  getAdminReminderById(id: number): Promise<AdminReminder | undefined>;
  createAdminReminder(reminder: InsertAdminReminder): Promise<AdminReminder>;
  updateAdminReminder(id: number, updates: Partial<InsertAdminReminder>): Promise<AdminReminder>;
  getAdminReminderByKey(userId: number | null, reminderKey: string): Promise<AdminReminder | undefined>;
  getApprovedAdmins(): Promise<User[]>;

  getAdminSettings(userId: number): Promise<AdminSettings | undefined>;
  upsertAdminSettings(userId: number, settings: Partial<Omit<InsertAdminSettings, "id" | "userId" | "createdAt">>): Promise<AdminSettings>;
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

  async getSiteOffer(slug: string): Promise<SiteOffer | undefined> {
    const [row] = await db.select().from(siteOffers).where(eq(siteOffers.slug, slug));
    return row ?? undefined;
  }

  async listSiteOffers(): Promise<SiteOffer[]> {
    return db.select().from(siteOffers).orderBy(siteOffers.slug);
  }

  async setSiteOffer(
    slug: string,
    data: { name: string; metaTitle?: string | null; metaDescription?: string | null; sections: Record<string, unknown> }
  ): Promise<SiteOffer> {
    const [row] = await db
      .insert(siteOffers)
      .values({
        slug,
        name: data.name,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        sections: data.sections,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteOffers.slug,
        set: {
          name: data.name,
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
          sections: data.sections,
          updatedAt: new Date(),
        },
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
    const now = new Date();
    return db.select()
      .from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), lte(blogPosts.publishedAt, now)))
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
  
  async createBlogPost(post: InsertBlogPost & { isPublished?: boolean }, authorId: number): Promise<BlogPost> {
    const publishedAt =
      post.publishedAt != null
        ? typeof post.publishedAt === "string"
          ? new Date(post.publishedAt)
          : post.publishedAt
        : new Date();
    const [insertedPost] = await db
      .insert(blogPosts)
      .values({
        ...post,
        coverImage: post.coverImage ?? "",
        publishedAt,
        authorId,
        isPublished: post.isPublished ?? false,
      })
      .returning();
    return insertedPost;
  }
  
  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    const now = new Date();
    const publishedAt =
      post.publishedAt != null
        ? typeof post.publishedAt === "string"
          ? new Date(post.publishedAt)
          : post.publishedAt
        : undefined;
    const { publishedAt: _omit, ...rest } = post;
    const [updatedPost] = await db
      .update(blogPosts)
      .set({
        ...rest,
        ...(publishedAt !== undefined && { publishedAt }),
        updatedAt: now,
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

  async getCrmContactsByAccountId(accountId: number): Promise<CrmContact[]> {
    return db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.accountId, accountId))
      .orderBy(desc(crmContacts.updatedAt));
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

  async getCrmDeals(contactId?: number, accountId?: number, pipelineStage?: string): Promise<(CrmDeal & { contact?: CrmContact; account?: CrmAccount })[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (contactId != null) conditions.push(eq(crmDeals.contactId, contactId));
    if (accountId != null) conditions.push(eq(crmDeals.accountId, accountId));
    if (pipelineStage != null) conditions.push(eq(crmDeals.pipelineStage, pipelineStage));
    const whereClause = conditions.length ? and(...conditions) : undefined;
    const deals = whereClause
      ? await db.select().from(crmDeals).where(whereClause).orderBy(desc(crmDeals.updatedAt))
      : await db.select().from(crmDeals).orderBy(desc(crmDeals.updatedAt));
    const contactIds = [...new Set(deals.map((d) => d.contactId))];
    const accountIds = [...new Set(deals.map((d) => d.accountId).filter((id): id is number => id != null))];
    const contacts = await Promise.all(contactIds.map((id) => this.getCrmContactById(id)));
    const accounts = accountIds.length ? await Promise.all(accountIds.map((id) => this.getCrmAccountById(id))) : [];
    const contactById = Object.fromEntries(contactIds.map((id, i) => [id, contacts[i]]));
    const accountById = Object.fromEntries(accountIds.map((id, i) => [id, accounts[i]]));
    return deals.map((d) => ({
      ...d,
      contact: contactById[d.contactId],
      account: d.accountId != null ? accountById[d.accountId] : undefined,
    }));
  }

  async getCrmDealById(id: number): Promise<(CrmDeal & { contact?: CrmContact; account?: CrmAccount }) | undefined> {
    const [row] = await db.select().from(crmDeals).where(eq(crmDeals.id, id));
    if (!row) return undefined;
    const contact = await this.getCrmContactById(row.contactId);
    const account = row.accountId != null ? await this.getCrmAccountById(row.accountId) : undefined;
    return { ...row, contact: contact ?? undefined, account };
  }

  async getCrmAccounts(): Promise<CrmAccount[]> {
    return db.select().from(crmAccounts).orderBy(desc(crmAccounts.updatedAt));
  }

  async getCrmAccountById(id: number): Promise<CrmAccount | undefined> {
    const [row] = await db.select().from(crmAccounts).where(eq(crmAccounts.id, id));
    return row ?? undefined;
  }

  async createCrmAccount(account: InsertCrmAccount): Promise<CrmAccount> {
    const now = new Date();
    const [inserted] = await db.insert(crmAccounts).values({ ...account, createdAt: now, updatedAt: now }).returning();
    return inserted;
  }

  async updateCrmAccount(id: number, updates: Partial<InsertCrmAccount>): Promise<CrmAccount> {
    const [updated] = await db.update(crmAccounts).set({ ...updates, updatedAt: new Date() }).where(eq(crmAccounts.id, id)).returning();
    return updated;
  }

  async deleteCrmAccount(id: number): Promise<void> {
    await db.delete(crmAccounts).where(eq(crmAccounts.id, id));
  }

  async createCrmActivityLog(entry: InsertCrmActivityLog): Promise<CrmActivityLog> {
    const [inserted] = await db.insert(crmActivityLog).values(entry).returning();
    return inserted;
  }

  async getCrmActivityLogByContactId(contactId: number, limit = 50): Promise<CrmActivityLog[]> {
    return db
      .select()
      .from(crmActivityLog)
      .where(eq(crmActivityLog.contactId, contactId))
      .orderBy(desc(crmActivityLog.createdAt))
      .limit(Math.min(limit, 100));
  }

  async getCrmActivityLogByAccountId(accountId: number, limit = 50): Promise<CrmActivityLog[]> {
    return db
      .select()
      .from(crmActivityLog)
      .where(eq(crmActivityLog.accountId, accountId))
      .orderBy(desc(crmActivityLog.createdAt))
      .limit(Math.min(limit, 100));
  }

  async getCrmActivityLogByDealId(dealId: number, limit = 50): Promise<CrmActivityLog[]> {
    return db
      .select()
      .from(crmActivityLog)
      .where(eq(crmActivityLog.dealId, dealId))
      .orderBy(desc(crmActivityLog.createdAt))
      .limit(Math.min(limit, 100));
  }

  async getCrmResearchProfileByAccountId(accountId: number): Promise<CrmResearchProfile | undefined> {
    const [row] = await db.select().from(crmResearchProfiles).where(eq(crmResearchProfiles.accountId, accountId));
    return row ?? undefined;
  }

  async getCrmResearchProfiles(accountId?: number): Promise<CrmResearchProfile[]> {
    if (accountId != null) {
      return db.select().from(crmResearchProfiles).where(eq(crmResearchProfiles.accountId, accountId));
    }
    return db.select().from(crmResearchProfiles).orderBy(desc(crmResearchProfiles.updatedAt));
  }

  async createCrmResearchProfile(profile: InsertCrmResearchProfile): Promise<CrmResearchProfile> {
    const now = new Date();
    const [inserted] = await db.insert(crmResearchProfiles).values({ ...profile, createdAt: now, updatedAt: now }).returning();
    return inserted;
  }

  async updateCrmResearchProfile(id: number, updates: Partial<InsertCrmResearchProfile>): Promise<CrmResearchProfile> {
    const [updated] = await db.update(crmResearchProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(crmResearchProfiles.id, id)).returning();
    return updated;
  }

  async createCrmAiGuidance(entry: InsertCrmAiGuidance): Promise<CrmAiGuidance> {
    const now = new Date();
    const [inserted] = await db.insert(crmAiGuidance).values({ ...entry, createdAt: now, updatedAt: now }).returning();
    return inserted;
  }

  async getCrmAiGuidanceByEntity(entityType: string, entityId: number): Promise<CrmAiGuidance[]> {
    return db
      .select()
      .from(crmAiGuidance)
      .where(and(eq(crmAiGuidance.entityType, entityType), eq(crmAiGuidance.entityId, entityId)))
      .orderBy(desc(crmAiGuidance.generatedAt));
  }

  async getCrmAiGuidanceByEntityAndType(entityType: string, entityId: number, outputType: string): Promise<CrmAiGuidance | undefined> {
    const [row] = await db
      .select()
      .from(crmAiGuidance)
      .where(
        and(
          eq(crmAiGuidance.entityType, entityType),
          eq(crmAiGuidance.entityId, entityId),
          eq(crmAiGuidance.outputType, outputType)
        )
      )
      .orderBy(desc(crmAiGuidance.generatedAt))
      .limit(1);
    return row;
  }

  async updateCrmAiGuidance(
    id: number,
    updates: Partial<Pick<InsertCrmAiGuidance, "content" | "providerType" | "version" | "generatedAt" | "staleAt" | "updatedAt">>
  ): Promise<CrmAiGuidance> {
    const [updated] = await db.update(crmAiGuidance).set({ ...updates, updatedAt: new Date() }).where(eq(crmAiGuidance.id, id)).returning();
    return updated;
  }

  async createCrmWorkflowExecution(entry: InsertCrmWorkflowExecution): Promise<CrmWorkflowExecution> {
    const [inserted] = await db.insert(crmWorkflowExecutions).values(entry).returning();
    return inserted;
  }

  async getCrmWorkflowExecutionsByEntity(entityType: string, entityId: number, limit = 20): Promise<CrmWorkflowExecution[]> {
    return db
      .select()
      .from(crmWorkflowExecutions)
      .where(and(eq(crmWorkflowExecutions.relatedEntityType, entityType), eq(crmWorkflowExecutions.relatedEntityId, entityId)))
      .orderBy(desc(crmWorkflowExecutions.startedAt))
      .limit(limit);
  }

  async createCrmDiscoveryWorkspace(entry: InsertCrmDiscoveryWorkspace): Promise<CrmDiscoveryWorkspace> {
    const [inserted] = await db.insert(crmDiscoveryWorkspaces).values(entry).returning();
    return inserted;
  }

  async getCrmDiscoveryWorkspaceById(id: number): Promise<CrmDiscoveryWorkspace | undefined> {
    const [row] = await db.select().from(crmDiscoveryWorkspaces).where(eq(crmDiscoveryWorkspaces.id, id));
    return row;
  }

  async getCrmDiscoveryWorkspacesByContactId(contactId: number): Promise<CrmDiscoveryWorkspace[]> {
    return db
      .select()
      .from(crmDiscoveryWorkspaces)
      .where(eq(crmDiscoveryWorkspaces.contactId, contactId))
      .orderBy(desc(crmDiscoveryWorkspaces.updatedAt));
  }

  async getCrmDiscoveryWorkspacesByDealId(dealId: number): Promise<CrmDiscoveryWorkspace[]> {
    return db
      .select()
      .from(crmDiscoveryWorkspaces)
      .where(eq(crmDiscoveryWorkspaces.dealId, dealId))
      .orderBy(desc(crmDiscoveryWorkspaces.updatedAt));
  }

  async updateCrmDiscoveryWorkspace(id: number, updates: Partial<InsertCrmDiscoveryWorkspace>): Promise<CrmDiscoveryWorkspace> {
    const [updated] = await db
      .update(crmDiscoveryWorkspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmDiscoveryWorkspaces.id, id))
      .returning();
    return updated;
  }

  async createCrmProposalPrepWorkspace(entry: InsertCrmProposalPrepWorkspace): Promise<CrmProposalPrepWorkspace> {
    const [inserted] = await db.insert(crmProposalPrepWorkspaces).values(entry).returning();
    return inserted;
  }

  async getCrmProposalPrepWorkspaceById(id: number): Promise<CrmProposalPrepWorkspace | undefined> {
    const [row] = await db.select().from(crmProposalPrepWorkspaces).where(eq(crmProposalPrepWorkspaces.id, id));
    return row;
  }

  async getCrmProposalPrepWorkspacesByContactId(contactId: number): Promise<CrmProposalPrepWorkspace[]> {
    return db
      .select()
      .from(crmProposalPrepWorkspaces)
      .where(eq(crmProposalPrepWorkspaces.contactId, contactId))
      .orderBy(desc(crmProposalPrepWorkspaces.updatedAt));
  }

  async getCrmProposalPrepWorkspacesByDealId(dealId: number): Promise<CrmProposalPrepWorkspace[]> {
    return db
      .select()
      .from(crmProposalPrepWorkspaces)
      .where(eq(crmProposalPrepWorkspaces.dealId, dealId))
      .orderBy(desc(crmProposalPrepWorkspaces.updatedAt));
  }

  async updateCrmProposalPrepWorkspace(id: number, updates: Partial<InsertCrmProposalPrepWorkspace>): Promise<CrmProposalPrepWorkspace> {
    const [updated] = await db
      .update(crmProposalPrepWorkspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmProposalPrepWorkspaces.id, id))
      .returning();
    return updated;
  }

  async createCrmSalesPlaybook(entry: InsertCrmSalesPlaybook): Promise<CrmSalesPlaybook> {
    const [inserted] = await db.insert(crmSalesPlaybooks).values(entry).returning();
    return inserted;
  }

  async getCrmSalesPlaybookById(id: number): Promise<CrmSalesPlaybook | undefined> {
    const [row] = await db.select().from(crmSalesPlaybooks).where(eq(crmSalesPlaybooks.id, id));
    return row;
  }

  async getCrmSalesPlaybooks(activeOnly = true): Promise<CrmSalesPlaybook[]> {
    if (activeOnly) {
      return db.select().from(crmSalesPlaybooks).where(eq(crmSalesPlaybooks.active, true)).orderBy(crmSalesPlaybooks.title);
    }
    return db.select().from(crmSalesPlaybooks).orderBy(crmSalesPlaybooks.title);
  }

  async updateCrmSalesPlaybook(id: number, updates: Partial<InsertCrmSalesPlaybook>): Promise<CrmSalesPlaybook> {
    const [updated] = await db
      .update(crmSalesPlaybooks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(crmSalesPlaybooks.id, id))
      .returning();
    return updated;
  }

  async getCrmDashboardStats(): Promise<{
    totalContacts: number;
    totalAccounts: number;
    totalActiveLeads: number;
    leadsMissingData: number;
    proposalReadyCount: number;
    followUpNeededCount: number;
    sequenceReadyCount: number;
    leadsByPipelineStage: { stage: string; count: number }[];
    recentTasks: (CrmTask & { contact?: CrmContact })[];
    overdueTasks: (CrmTask & { contact?: CrmContact })[];
    recentActivity: CrmActivityLog[];
    accountsNeedingResearch: number;
    topSources: { source: string; count: number }[];
    topTags: { tag: string; count: number }[];
    discoveryWorkspacesIncomplete?: number;
    proposalPrepNeedingAttention?: number;
  }> {
    const [contacts, accounts, deals, allTasks, activityRows, researchProfiles] = await Promise.all([
      this.getCrmContacts(),
      this.getCrmAccounts(),
      this.getCrmDeals(),
      this.getCrmTasks({ incompleteOnly: true }),
      db.select().from(crmActivityLog).orderBy(desc(crmActivityLog.createdAt)).limit(20),
      this.getCrmResearchProfiles(),
    ]);
    const accountIdsWithResearch = new Set(researchProfiles.map((r) => r.accountId));
    const accountsNeedingResearch = accounts.filter((a) => !accountIdsWithResearch.has(a.id)).length;
    const activeStages = ["new_lead", "researching", "qualified", "proposal_ready", "follow_up", "negotiation"];
    const activeLeads = deals.filter((d) => d.pipelineStage && activeStages.includes(d.pipelineStage));
    const leadsMissingData = activeLeads.filter(
      (d) =>
        !d.primaryPainPoint ||
        !d.budgetRange ||
        ((d.pipelineStage === "qualified" || d.pipelineStage === "proposal_ready" || d.pipelineStage === "negotiation") && !d.expectedCloseAt)
    ).length;
    const proposalReadyCount = deals.filter((d) => d.pipelineStage === "proposal_ready").length;
    const nowForFollowUp = new Date();
    const followUpNeededCount = contacts.filter(
      (c) =>
        (c.nextFollowUpAt && new Date(c.nextFollowUpAt) < nowForFollowUp) ||
        c.outreachState === "follow_up_due"
    ).length;
    const sequenceReadyCount = contacts.filter((c) => c.sequenceReady === true).length;
    const stages = ["new_lead", "researching", "qualified", "proposal_ready", "follow_up", "negotiation", "won", "lost", "nurture"];
    const leadsByPipelineStage = stages.map((stage) => ({
      stage,
      count: deals.filter((d) => d.pipelineStage === stage).length,
    }));
    const now = new Date();
    const overdueTasks = allTasks.filter((t) => t.dueAt && !t.completedAt && new Date(t.dueAt) < now);
    const recentTasks = allTasks.slice(0, 10);
    const contactIds = [...new Set(allTasks.map((t) => t.contactId))];
    const contactsForTasks = await Promise.all(contactIds.map((id) => this.getCrmContactById(id)));
    const contactById = Object.fromEntries(contactIds.map((id, i) => [id, contactsForTasks[i]]));
    const sourceCounts: Record<string, number> = {};
    for (const c of contacts) {
      const s = c.source?.trim() || c.utmSource?.trim() || "unknown";
      sourceCounts[s] = (sourceCounts[s] ?? 0) + 1;
    }
    const topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const tagCounts: Record<string, number> = {};
    for (const c of contacts) {
      const tags = c.tags ?? [];
      for (const t of tags) {
        if (typeof t === "string") tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    let discoveryWorkspacesIncomplete = 0;
    let proposalPrepNeedingAttention = 0;
    try {
      const [dCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmDiscoveryWorkspaces)
        .where(inArray(crmDiscoveryWorkspaces.status, ["draft", "scheduled"]));
      discoveryWorkspacesIncomplete = dCount?.count ?? 0;
      const [pCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmProposalPrepWorkspaces)
        .where(inArray(crmProposalPrepWorkspaces.status, ["draft", "needs_clarification"]));
      proposalPrepNeedingAttention = pCount?.count ?? 0;
    } catch {
      // Tables may not exist in older DBs
    }

    return {
      totalContacts: contacts.length,
      totalAccounts: accounts.length,
      totalActiveLeads: activeLeads.length,
      leadsMissingData,
      proposalReadyCount,
      followUpNeededCount,
      sequenceReadyCount,
      leadsByPipelineStage,
      recentTasks: recentTasks.map((t) => ({ ...t, contact: contactById[t.contactId] })),
      overdueTasks: overdueTasks.map((t) => ({ ...t, contact: contactById[t.contactId] })),
      recentActivity: activityRows,
      accountsNeedingResearch,
      topSources,
      topTags,
      discoveryWorkspacesIncomplete,
      proposalPrepNeedingAttention,
    };
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

  async getVisitorActivityRecent(since?: Date, limit = 200): Promise<VisitorActivity[]> {
    const conditions = since ? [gte(visitorActivity.createdAt, since)] : [];
    const maxLimit = Math.min(limit, 500);
    const baseSelect = {
      id: visitorActivity.id,
      visitorId: visitorActivity.visitorId,
      leadId: visitorActivity.leadId,
      sessionId: visitorActivity.sessionId,
      pageVisited: visitorActivity.pageVisited,
      eventType: visitorActivity.eventType,
      referrer: visitorActivity.referrer,
      deviceType: visitorActivity.deviceType,
      metadata: visitorActivity.metadata,
      createdAt: visitorActivity.createdAt,
    };
    try {
      const rows = await db
        .select({
          ...baseSelect,
          country: visitorActivity.country,
          region: visitorActivity.region,
          city: visitorActivity.city,
          timezone: visitorActivity.timezone,
        })
        .from(visitorActivity)
        .where(conditions.length ? and(...conditions) : sql`1=1`)
        .orderBy(desc(visitorActivity.createdAt))
        .limit(maxLimit);
      return rows as VisitorActivity[];
    } catch {
      const baseRows = await db
        .select(baseSelect)
        .from(visitorActivity)
        .where(conditions.length ? and(...conditions) : sql`1=1`)
        .orderBy(desc(visitorActivity.createdAt))
        .limit(maxLimit);
      return baseRows.map((r) => ({ ...r, country: null, region: null, city: null, timezone: null })) as VisitorActivity[];
    }
  }

  async createCrmAlert(alert: InsertCrmAlert): Promise<CrmAlert> {
    const [inserted] = await db.insert(crmAlerts).values(alert).returning();
    return inserted;
  }

  async createLeadScoreEvent(event: InsertLeadScoreEvent): Promise<LeadScoreEvent> {
    const [inserted] = await db.insert(leadScoreEvents).values(event).returning();
    return inserted;
  }

  async getLeadScoreEventsByLeadId(leadId: number): Promise<LeadScoreEvent[]> {
    return db
      .select()
      .from(leadScoreEvents)
      .where(eq(leadScoreEvents.leadId, leadId))
      .orderBy(desc(leadScoreEvents.createdAt));
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

  async getWebsiteTrafficAnalytics(since?: Date): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    byPage: { page: string; count: number; unique: number }[];
    byEventType: { eventType: string; count: number }[];
    byDevice: { device: string; count: number }[];
    byReferrer: { referrer: string; count: number }[];
    byCountry: { country: string; count: number; unique: number }[];
    byRegion: { region: string; country: string; count: number }[];
    byCity: { city: string; region: string; country: string; count: number }[];
    byTimezone: { timezone: string; count: number }[];
    byUtmSource: { value: string; count: number }[];
    byUtmMedium: { value: string; count: number }[];
    byUtmCampaign: { value: string; count: number }[];
  }> {
    const conditions = since ? [gte(visitorActivity.createdAt, since)] : [];
    const rows = await db
      .select({
        visitorId: visitorActivity.visitorId,
        pageVisited: visitorActivity.pageVisited,
        eventType: visitorActivity.eventType,
        deviceType: visitorActivity.deviceType,
        referrer: visitorActivity.referrer,
        country: visitorActivity.country,
        region: visitorActivity.region,
        city: visitorActivity.city,
        timezone: visitorActivity.timezone,
        metadata: visitorActivity.metadata,
      })
      .from(visitorActivity)
      .where(conditions.length ? and(...conditions) : sql`1=1`);

    const totalEvents = rows.length;
    const uniqueVisitors = new Set(rows.map((r) => r.visitorId)).size;

    const pageMap = new Map<string, { count: number; visitors: Set<string> }>();
    const eventMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();
    const countryMap = new Map<string, { count: number; visitors: Set<string> }>();
    const regionMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const timezoneMap = new Map<string, number>();
    const utmSourceMap = new Map<string, number>();
    const utmMediumMap = new Map<string, number>();
    const utmCampaignMap = new Map<string, number>();

    for (const r of rows) {
      const page = (r.pageVisited ?? "").trim();
      if (page) {
        if (!pageMap.has(page)) pageMap.set(page, { count: 0, visitors: new Set() });
        const entry = pageMap.get(page)!;
        entry.count += 1;
        entry.visitors.add(r.visitorId);
      }
      eventMap.set(r.eventType, (eventMap.get(r.eventType) ?? 0) + 1);
      const dev = (r.deviceType ?? "").trim();
      if (dev) deviceMap.set(dev, (deviceMap.get(dev) ?? 0) + 1);
      const ref = r.referrer?.trim() && r.referrer !== "" ? r.referrer : "(direct)";
      referrerMap.set(ref, (referrerMap.get(ref) ?? 0) + 1);
      const country = (r.country ?? "").trim();
      if (country) {
        if (!countryMap.has(country)) countryMap.set(country, { count: 0, visitors: new Set() });
        countryMap.get(country)!.count += 1;
        countryMap.get(country)!.visitors.add(r.visitorId);
        const region = (r.region ?? "").trim();
        if (region) {
          const regionKey = `${country}|${region}`;
          const prevRegion = regionMap.get(regionKey);
          regionMap.set(regionKey, (typeof prevRegion === "number" ? prevRegion : 0) + 1);
        }
        const city = (r.city ?? "").trim();
        if (city) {
          const region = (r.region ?? "").trim();
          const cityKey = `${country}|${region}|${city}`;
          const prevCity = cityMap.get(cityKey);
          cityMap.set(cityKey, (typeof prevCity === "number" ? prevCity : 0) + 1);
        }
      }
      const tz = (r.timezone ?? "").trim();
      if (tz) timezoneMap.set(tz, (timezoneMap.get(tz) ?? 0) + 1);
      const meta = (r.metadata as Record<string, unknown> | null) ?? {};
      const uSource = (meta.utm_source as string)?.trim?.();
      const uMedium = (meta.utm_medium as string)?.trim?.();
      const uCampaign = (meta.utm_campaign as string)?.trim?.();
      if (uSource) utmSourceMap.set(uSource, (utmSourceMap.get(uSource) ?? 0) + 1);
      if (uMedium) utmMediumMap.set(uMedium, (utmMediumMap.get(uMedium) ?? 0) + 1);
      if (uCampaign) utmCampaignMap.set(uCampaign, (utmCampaignMap.get(uCampaign) ?? 0) + 1);
    }

    const byPage = [...pageMap.entries()]
      .map(([page, v]) => ({ page, count: v.count, unique: v.visitors.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
    const byEventType = [...eventMap.entries()].map(([eventType, count]) => ({ eventType, count })).sort((a, b) => b.count - a.count);
    const byDevice = [...deviceMap.entries()].map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count);
    const byReferrer = [...referrerMap.entries()]
      .map(([referrer, count]) => ({ referrer: referrer.length > 80 ? referrer.slice(0, 80) + "…" : referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const byCountry = [...countryMap.entries()]
      .map(([country, v]) => ({ country, count: v.count, unique: v.visitors.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
    const byRegion = [...regionMap.entries()]
      .map(([key, count]) => {
        const [country, region] = key.split("|");
        return { region: region ?? "", country: country ?? "", count };
      })
      .filter((r) => r.region && r.country)
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);
    const byCity = [...cityMap.entries()]
      .map(([key, count]) => {
        const parts = key.split("|");
        return { city: parts[2] ?? "", region: parts[1] ?? "", country: parts[0] ?? "", count };
      })
      .filter((r) => r.city && r.country)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    const byTimezone = [...timezoneMap.entries()]
      .map(([timezone, count]) => ({ timezone, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const byUtmSource = [...utmSourceMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const byUtmMedium = [...utmMediumMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const byUtmCampaign = [...utmCampaignMap.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalEvents,
      uniqueVisitors,
      byPage,
      byEventType,
      byDevice,
      byReferrer,
      byCountry,
      byRegion,
      byCity,
      byTimezone,
      byUtmSource,
      byUtmMedium,
      byUtmCampaign,
    };
  }

  async getLeadMagnetPerformance(since?: Date): Promise<{
    totalLeads: number;
    bySource: { source: string; label: string; count: number }[];
    recentCount: number;
  }> {
    const allContacts = await this.getAllContacts();
    const sinceTime = since?.getTime();
    const filter = (c: Contact) => {
      if (!sinceTime) return true;
      const created = typeof c.createdAt === "string" ? new Date(c.createdAt).getTime() : 0;
      return created >= sinceTime;
    };
    const filtered = allContacts.filter(filter);
    const totalLeads = filtered.length;
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const recentCount = filtered.filter((c) => {
      const created = typeof c.createdAt === "string" ? new Date(c.createdAt).getTime() : 0;
      return created >= last30.getTime();
    }).length;

    const bucket = (subject: string | null, projectType: string | null): string => {
      const s = (subject ?? "").toLowerCase();
      const p = (projectType ?? "").toLowerCase();
      if (s.includes("audit") || s.includes("digital growth")) return "audit";
      if (p.includes("strategy call") || s.includes("strategy call")) return "strategy_call";
      if (s.includes("competitor") || s.includes("snapshot")) return "competitor_snapshot";
      if (s.includes("quote") || p.includes("quote")) return "quote";
      return "contact";
    };
    const label: Record<string, string> = {
      audit: "Digital Growth Audit",
      strategy_call: "Strategy Call",
      competitor_snapshot: "Competitor Snapshot",
      quote: "Quote / Project",
      contact: "Contact / Other",
    };
    const sourceCount = new Map<string, number>();
    for (const c of filtered) {
      const key = bucket(c.subject, c.projectType);
      sourceCount.set(key, (sourceCount.get(key) ?? 0) + 1);
    }
    const bySource = [...sourceCount.entries()]
      .map(([source, count]) => ({ source, label: label[source] ?? source, count }))
      .sort((a, b) => b.count - a.count);

    return { totalLeads, bySource, recentCount };
  }

  async getLeadDemographics(since?: Date): Promise<{
    byAgeRange: { value: string; count: number }[];
    byGender: { value: string; count: number }[];
    byOccupation: { value: string; count: number }[];
    byCompanySize: { value: string; count: number }[];
    byIndustry: { value: string; count: number }[];
    totalWithDemographics: number;
    sources: string[];
  }> {
    const [legacyContacts, crmContacts] = await Promise.all([this.getAllContacts(), this.getCrmContacts().catch(() => [])]);
    const sinceTime = since?.getTime();
    const filterLegacy = (c: Contact) => {
      if (!sinceTime) return true;
      const t = typeof c.createdAt === "string" ? new Date(c.createdAt).getTime() : 0;
      return t >= sinceTime;
    };
    const filterCrm = (c: CrmContact) => {
      if (!sinceTime) return true;
      const t = c.createdAt instanceof Date ? c.createdAt.getTime() : new Date(c.createdAt as string).getTime();
      return t >= sinceTime;
    };
    const filteredLegacy = legacyContacts.filter(filterLegacy);
    const filteredCrm = crmContacts.filter(filterCrm);

    const ageMap = new Map<string, number>();
    const genderMap = new Map<string, number>();
    const occupationMap = new Map<string, number>();
    const companySizeMap = new Map<string, number>();
    const industryMap = new Map<string, number>();

    const inc = (map: Map<string, number>, key: string) => {
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    };

    for (const c of filteredLegacy) {
      const age = (c as Contact & { ageRange?: string | null }).ageRange?.trim();
      const gender = (c as Contact & { gender?: string | null }).gender?.trim();
      const occupation = (c as Contact & { occupation?: string | null }).occupation?.trim();
      const companySize = (c as Contact & { companySize?: string | null }).companySize?.trim();
      inc(ageMap, age ?? "");
      inc(genderMap, gender ?? "");
      inc(occupationMap, occupation ?? "");
      inc(companySizeMap, companySize ?? "");
    }
    for (const c of filteredCrm) {
      inc(ageMap, c.ageRange?.trim() ?? "");
      inc(genderMap, c.gender?.trim() ?? "");
      inc(occupationMap, c.jobTitle?.trim() ?? "");
      inc(companySizeMap, c.companySize?.trim() ?? "");
      inc(industryMap, c.industry?.trim() ?? "");
    }

    const totalWithDemographics =
      filteredLegacy.filter((c) => {
        const age = (c as Contact & { ageRange?: string | null }).ageRange?.trim();
        const gender = (c as Contact & { gender?: string | null }).gender?.trim();
        const occupation = (c as Contact & { occupation?: string | null }).occupation?.trim();
        const companySize = (c as Contact & { companySize?: string | null }).companySize?.trim();
        return !!(age || gender || occupation || companySize);
      }).length +
      filteredCrm.filter((c) => !!(c.ageRange || c.gender || c.jobTitle || c.companySize || c.industry)).length;

    const byAgeRange = [...ageMap.entries()].filter(([v]) => v).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    const byGender = [...genderMap.entries()].filter(([v]) => v).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    const byOccupation = [...occupationMap.entries()].filter(([v]) => v).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    const byCompanySize = [...companySizeMap.entries()].filter(([v]) => v).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
    const byIndustry = [...industryMap.entries()].filter(([v]) => v).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);

    const sources: string[] = [];
    if (filteredLegacy.length > 0) sources.push("contact_forms");
    if (filteredCrm.length > 0) sources.push("crm_contacts");

    return { byAgeRange, byGender, byOccupation, byCompanySize, byIndustry, totalWithDemographics, sources };
  }

  async getVisitorActivityFiltered(filters: {
    since?: Date;
    until?: Date;
    eventType?: string;
    page?: string;
    deviceType?: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    experimentKey?: string;
    experimentVariant?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: VisitorActivity[]; total: number }> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filters.since) conditions.push(gte(visitorActivity.createdAt, filters.since));
    if (filters.until) conditions.push(lte(visitorActivity.createdAt, filters.until));
    if (filters.eventType) conditions.push(eq(visitorActivity.eventType, filters.eventType));
    if (filters.page) conditions.push(eq(visitorActivity.pageVisited, filters.page));
    if (filters.deviceType) conditions.push(eq(visitorActivity.deviceType, filters.deviceType));
    if (filters.country) conditions.push(eq(visitorActivity.country, filters.country));
    if (filters.region) conditions.push(eq(visitorActivity.region, filters.region));
    if (filters.city) conditions.push(eq(visitorActivity.city, filters.city));
    if (filters.timezone) conditions.push(eq(visitorActivity.timezone, filters.timezone));
    if (filters.referrer) conditions.push(eq(visitorActivity.referrer, filters.referrer));
    if (filters.utmSource) conditions.push(sql`${visitorActivity.metadata}->>'utm_source' = ${filters.utmSource}`);
    if (filters.utmMedium) conditions.push(sql`${visitorActivity.metadata}->>'utm_medium' = ${filters.utmMedium}`);
    if (filters.utmCampaign) conditions.push(sql`${visitorActivity.metadata}->>'utm_campaign' = ${filters.utmCampaign}`);
    if (filters.experimentKey) conditions.push(sql`${visitorActivity.metadata}->>'experiment_key' = ${filters.experimentKey}`);
    if (filters.experimentVariant) conditions.push(sql`${visitorActivity.metadata}->>'experiment_variant' = ${filters.experimentVariant}`);

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const limit = Math.min(5000, Math.max(1, filters.limit ?? 500));
    const offset = Math.max(0, filters.offset ?? 0);

    const [totalRows, events] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(visitorActivity).where(whereClause ?? sql`1=1`),
      db.select().from(visitorActivity).where(whereClause ?? sql`1=1`).orderBy(desc(visitorActivity.createdAt)).limit(limit).offset(offset),
    ]);
    const total = Number(totalRows[0]?.count ?? 0);
    return { events, total };
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

  async getCrmTasks(filters: { contactId?: number; relatedDealId?: number; relatedAccountId?: number; overdueOnly?: boolean; incompleteOnly?: boolean }): Promise<(CrmTask & { contact?: CrmContact })[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filters.contactId != null) conditions.push(eq(crmTasks.contactId, filters.contactId));
    if (filters.relatedDealId != null) conditions.push(eq(crmTasks.relatedDealId, filters.relatedDealId));
    if (filters.relatedAccountId != null) conditions.push(eq(crmTasks.relatedAccountId, filters.relatedAccountId));
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
    if (filters.lifecycleStage) contacts = contacts.filter((c) => c.lifecycleStage === filters.lifecycleStage);
    if (filters.tags && filters.tags.length > 0) {
      const tagSet = new Set(filters.tags);
      contacts = contacts.filter((c) => {
        const ct = c.tags ?? [];
        return ct.some((t) => typeof t === "string" && tagSet.has(t));
      });
    }
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
    if (filters.pipelineStage) {
      const deals = await this.getCrmDeals(undefined, undefined, filters.pipelineStage);
      const contactIds = new Set(deals.map((d) => d.contactId));
      contacts = contacts.filter((c) => contactIds.has(c.id));
    }
    if (filters.hasResearch === true) {
      const profiles = await this.getCrmResearchProfiles();
      const accountIdsWithResearch = new Set(profiles.map((r) => r.accountId));
      contacts = contacts.filter((c) => c.accountId != null && accountIdsWithResearch.has(c.accountId));
    } else if (filters.hasResearch === false) {
      const profiles = await this.getCrmResearchProfiles();
      const accountIdsWithResearch = new Set(profiles.map((r) => r.accountId));
      contacts = contacts.filter((c) => c.accountId == null || !accountIdsWithResearch.has(c.accountId));
    }
    return contacts;
  }

  async getBusinessGoalPresets(activeOnly = true): Promise<BusinessGoalPreset[]> {
    const conditions = activeOnly ? [eq(businessGoalPresets.active, true)] : [];
    return db
      .select()
      .from(businessGoalPresets)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(businessGoalPresets.priority), businessGoalPresets.key);
  }

  async getAdminReminders(filters: {
    userId?: number | null;
    status?: string;
    includeSnoozedDue?: boolean;
  }): Promise<AdminReminder[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (filters.userId !== undefined) {
      if (filters.userId == null) {
        conditions.push(isNull(adminReminders.userId));
      } else {
        conditions.push(or(eq(adminReminders.userId, filters.userId), isNull(adminReminders.userId))!);
      }
    }
    if (filters.status) {
      conditions.push(eq(adminReminders.status, filters.status));
    }
    if (filters.includeSnoozedDue) {
      const now = new Date();
      conditions.push(
        or(
          eq(adminReminders.status, "new"),
          and(eq(adminReminders.status, "snoozed"), lte(adminReminders.snoozedUntil, now))!
        )!
      );
    }
    const rows = await db
      .select()
      .from(adminReminders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(adminReminders.createdAt));
    return rows;
  }

  async getAdminReminderById(id: number): Promise<AdminReminder | undefined> {
    const [row] = await db.select().from(adminReminders).where(eq(adminReminders.id, id)).limit(1);
    return row ?? undefined;
  }

  async createAdminReminder(reminder: InsertAdminReminder): Promise<AdminReminder> {
    const now = new Date();
    const [inserted] = await db.insert(adminReminders).values({ ...reminder, createdAt: now, updatedAt: now }).returning();
    return inserted!;
  }

  async updateAdminReminder(id: number, updates: Partial<InsertAdminReminder>): Promise<AdminReminder> {
    const [updated] = await db.update(adminReminders).set({ ...updates, updatedAt: new Date() }).where(eq(adminReminders.id, id)).returning();
    if (!updated) throw new Error("Admin reminder not found");
    return updated;
  }

  async getAdminReminderByKey(userId: number | null, reminderKey: string): Promise<AdminReminder | undefined> {
    const keyMatch = eq(adminReminders.reminderKey, reminderKey);
    const userMatch =
      userId != null ? or(eq(adminReminders.userId, userId), isNull(adminReminders.userId))! : isNull(adminReminders.userId);
    const [row] = await db.select().from(adminReminders).where(and(keyMatch, userMatch)).limit(1);
    return row ?? undefined;
  }

  async getApprovedAdmins(): Promise<User[]> {
    const rows = await db.select().from(users).where(and(eq(users.isAdmin, true), eq(users.adminApproved, true)));
    return rows;
  }

  async getAdminSettings(userId: number): Promise<AdminSettings | undefined> {
    const [row] = await db.select().from(adminSettings).where(eq(adminSettings.userId, userId)).limit(1);
    return row ?? undefined;
  }

  async upsertAdminSettings(
    userId: number,
    settings: Partial<Omit<InsertAdminSettings, "id" | "userId" | "createdAt">>
  ): Promise<AdminSettings> {
    const now = new Date();
    const existing = await this.getAdminSettings(userId);
    const payload = {
      emailNotifications: settings.emailNotifications,
      inAppNotifications: settings.inAppNotifications,
      pushNotificationsEnabled: settings.pushNotificationsEnabled,
      remindersEnabled: settings.remindersEnabled,
      reminderFrequency: settings.reminderFrequency,
      notifyOnRoleChange: settings.notifyOnRoleChange,
      aiAgentCanPerformActions: settings.aiAgentCanPerformActions,
      updatedAt: now,
    };
    if (existing) {
      const [updated] = await db
        .update(adminSettings)
        .set(payload)
        .where(eq(adminSettings.userId, userId))
        .returning();
      return updated!;
    }
    const [inserted] = await db
      .insert(adminSettings)
      .values({ userId, ...payload, createdAt: now })
      .returning();
    return inserted!;
  }
}

export const storage = new DatabaseStorage();
