import type { UpdatesTopicId } from "./updatesFeedTopics";

export type UpdatesFeedItemKind = "rss" | "ascendra_blog" | "ascendra_note";

export interface UpdatesFeedItem {
  id: string;
  topics: UpdatesTopicId[];
  title: string;
  summary: string;
  url: string | null;
  sourceName: string;
  publishedAt: string;
  kind: UpdatesFeedItemKind;
}

export interface UpdatesFeedResponse {
  items: UpdatesFeedItem[];
  generatedAt: string;
  cacheTtlMs: number;
}
