export type LiveFeedSeverity = "info" | "warn" | "error";

export type LiveFeedItem = {
  id: string;
  kind: string;
  at: string;
  title: string;
  subtitle?: string;
  severity: LiveFeedSeverity;
};

export type LiveFeedResponse = {
  items: LiveFeedItem[];
  serverTime: number;
};
