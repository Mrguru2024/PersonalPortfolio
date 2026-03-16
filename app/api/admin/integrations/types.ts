export type IntegrationId = "facebook" | "brevo" | "zoom" | "social-scheduling";

export interface IntegrationStatus {
  id: IntegrationId;
  name: string;
  description: string;
  configured: boolean;
  status: "ok" | "not_configured" | "error";
  message?: string;
  reconnectUrl?: string;
}
