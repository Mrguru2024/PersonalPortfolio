/** Shared types for GET/PATCH `/api/admin/email-hub/tracking` (safe for client + server imports). */

export type EmailHubTrackingDefaults = {
  defaultTrackingOpen: boolean;
  defaultTrackingClick: boolean;
  defaultUnsubFooter: boolean;
};

export type EmailHubPriorityFollowUp = {
  contactId: number;
  name: string;
  email: string;
  company: string | null;
  intentLevel: string | null;
  leadScore: number | null;
  status: string | null;
  lifecycleStage: string | null;
  lastSignal: "click" | "open";
  lastSignalAt: string;
  messageId: number;
  subject: string | null;
};

export type EmailHubTrackingInsights = {
  windowDays: number;
  sentLast30d: number;
  trackedMessages30d: number;
  distinctOpens30d: number;
  distinctClicks30d: number;
  openRatePct: number | null;
  clickRatePct: number | null;
  clickThroughOfOpensPct: number | null;
  bounces30d: number;
  crmLinkedSent30d: number;
  crmTrackedMessages30d: number;
  crmDistinctOpens30d: number;
  crmDistinctClicks30d: number;
  crmOpenRatePct: number | null;
  crmClickRatePct: number | null;
  priorityFollowUps: EmailHubPriorityFollowUp[];
  recentActivity: {
    id: number;
    type: string;
    messageId: number;
    recipientEmail: string;
    at: string;
    subject?: string;
  }[];
};

export type EmailHubTrackingPagePayload = {
  connection: {
    brevoApiConfigured: boolean;
    webhookSecretConfigured: boolean;
    trackingDomain: string;
  };
  defaults: EmailHubTrackingDefaults;
  insights: EmailHubTrackingInsights;
};
