export const UPDATES_TOPIC_IDS = [
  "marketing",
  "tips_how_to",
  "digital_marketing",
  "industry_news",
  "ascendra_public",
] as const;

export type UpdatesTopicId = (typeof UPDATES_TOPIC_IDS)[number];

export const UPDATES_TOPIC_LABELS: Record<UpdatesTopicId, string> = {
  marketing: "Marketing",
  tips_how_to: "Tips & How to",
  digital_marketing: "Digital marketing",
  industry_news: "Industry news",
  ascendra_public: "Ascendra public news",
};

/** Short notes for the /updates page (source credibility). */
export const UPDATES_TOPIC_SOURCE_NOTES: Record<UpdatesTopicId, string> = {
  marketing:
    "HubSpot Marketing, Hootsuite, and Buffer — strategy, social, and content marketing from publishers brands trust.",
  tips_how_to:
    "Search Engine Journal how-tos, Ahrefs, and Social Media Examiner — step-by-step SEO, content, and channel execution.",
  digital_marketing:
    "Moz and Search Engine Land — search, SEO, and performance marketing depth.",
  industry_news:
    "Social Media Today, MarTech, and Marketing Dive — platform moves, martech, and industry headlines.",
  ascendra_public: "Ascendra blog posts and verified in-house public market notes.",
};
