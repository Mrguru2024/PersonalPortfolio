export type IntegrationId =
  | "facebook"
  | "brevo"
  | "zoom"
  | "social-scheduling"
  | "google_calendar"
  | "calendly";

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
