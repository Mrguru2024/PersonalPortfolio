export type IntegrationId =
  | "facebook"
  | "brevo"
  | "zoom"
  | "social-scheduling"
  | "google_calendar"
  | "calendly";

/** GET /api/admin/integrations/status → contentStudioSocial */
export type ContentStudioSocialPayload = {
  facebookPage: boolean;
  facebookOAuthConnected: boolean;
  facebookOAuthAvailable: boolean;
  facebookAccounts: { accountId: string; pageId: string; pageName: string }[];
  facebookMaxConnections: number;
  facebookCanAddConnection: boolean;
  facebookContentStudioRedirectUri: string;
  linkedin: boolean;
  linkedinOAuthConnected: boolean;
  linkedinOAuthAvailable: boolean;
  linkedinAccounts: { accountId: string; authorUrn: string; displayLabel: string }[];
  linkedinMaxConnections: number;
  linkedinCanAddConnection: boolean;
  linkedinContentStudioRedirectUri: string;
  x: boolean;
  xOAuthConnected: boolean;
  xOAuthAvailable: boolean;
  xAccounts: { accountId: string; username: string }[];
  xMaxConnections: number;
  xCanAddConnection: boolean;
  xContentStudioRedirectUri: string;
  threads: boolean;
  threadsOAuthConnected: boolean;
  threadsOAuthAvailable: boolean;
  threadsAccounts: { accountId: string; threadsUserId: string; username: string }[];
  threadsMaxConnections: number;
  threadsCanAddConnection: boolean;
  threadsContentStudioRedirectUri: string;
  webhook: boolean;
};

export interface IntegrationStatus {
  id: IntegrationId;
  name: string;
  description: string;
  configured: boolean;
  status: "ok" | "not_configured" | "error";
  message?: string;
  reconnectUrl?: string;
  /** When set, UI shows a same-origin link to start OAuth (e.g. Google Calendar). */
  connectHref?: string;
}
