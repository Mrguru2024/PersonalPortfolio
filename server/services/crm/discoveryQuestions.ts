/**
 * Stage 3.5: Discovery question engine — default question sets by category,
 * merge with AI-generated questions from guidance when available.
 */

export interface DiscoveryQuestionItem {
  id: string;
  category: string;
  question: string;
  serviceTypes?: string[]; // optional filter: web_design | funnel_optimization | branding | etc.
}

export const DISCOVERY_QUESTION_CATEGORIES = [
  "business_goals",
  "website_performance",
  "lead_generation_funnel",
  "branding_messaging",
  "automation_workflow",
  "content_seo",
  "technical_constraints",
  "timeline",
  "budget",
  "decision_maker_approvals",
  "success_metrics",
  "project_risks",
] as const;

export type DiscoveryQuestionCategory = (typeof DISCOVERY_QUESTION_CATEGORIES)[number];

const DEFAULT_QUESTIONS: DiscoveryQuestionItem[] = [
  { id: "bg-1", category: "business_goals", question: "What are the top 2–3 business outcomes you want from this project?" },
  { id: "bg-2", category: "business_goals", question: "How will you measure success in 6–12 months?" },
  { id: "wp-1", category: "website_performance", question: "How is your current website performing? What’s working and what isn’t?" },
  { id: "wp-2", category: "website_performance", question: "Do you have analytics or conversion data we should look at?" },
  { id: "lg-1", category: "lead_generation_funnel", question: "How do leads currently find you and what happens after they land?" },
  { id: "lg-2", category: "lead_generation_funnel", question: "Where do you see the biggest drop-off in your funnel?" },
  { id: "bm-1", category: "branding_messaging", question: "Is your brand and messaging clear, or does it need a refresh?" },
  { id: "aw-1", category: "automation_workflow", question: "What manual processes could be automated (lead follow-up, scheduling, etc.)?" },
  { id: "cs-1", category: "content_seo", question: "How important is content and SEO to your growth right now?" },
  { id: "tc-1", category: "technical_constraints", question: "Any technical constraints (platform, integrations, timeline) we should know?" },
  { id: "tl-1", category: "timeline", question: "What’s driving your timeline? Any hard deadlines or events?" },
  { id: "tl-2", category: "timeline", question: "When do you ideally want to launch or see results?" },
  { id: "bu-1", category: "budget", question: "Do you have a budget range in mind for this scope?" },
  { id: "bu-2", category: "budget", question: "How is budget approved internally (solo vs committee)?" },
  { id: "dm-1", category: "decision_maker_approvals", question: "Who else is involved in the decision, and what’s the approval process?" },
  { id: "dm-2", category: "decision_maker_approvals", question: "What would make this a no-brainer yes for them?" },
  { id: "sm-1", category: "success_metrics", question: "What would make you consider this project a win?" },
  { id: "pr-1", category: "project_risks", question: "What could get in the way of this project succeeding?" },
];

const CATEGORY_LABELS: Record<DiscoveryQuestionCategory, string> = {
  business_goals: "Business goals",
  website_performance: "Website performance",
  lead_generation_funnel: "Lead generation / funnel",
  branding_messaging: "Branding and messaging",
  automation_workflow: "Automation / workflow",
  content_seo: "Content / SEO",
  technical_constraints: "Technical constraints",
  timeline: "Timeline",
  budget: "Budget",
  decision_maker_approvals: "Decision-maker and approvals",
  success_metrics: "Success metrics",
  project_risks: "Project risks",
};

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat as DiscoveryQuestionCategory] ?? cat;
}

/** Default questions, optionally filtered by category and/or service type. */
export function getDefaultDiscoveryQuestions(opts?: {
  categories?: DiscoveryQuestionCategory[];
  serviceType?: string;
}): DiscoveryQuestionItem[] {
  let list = [...DEFAULT_QUESTIONS];
  if (opts?.categories?.length) {
    const set = new Set(opts.categories);
    list = list.filter((q) => set.has(q.category as DiscoveryQuestionCategory));
  }
  if (opts?.serviceType) {
    list = list.filter(
      (q) => !q.serviceTypes?.length || q.serviceTypes.includes(opts.serviceType!)
    );
  }
  return list;
}

/** AI guidance discovery_questions content shape (Stage 3). */
export interface AiDiscoveryQuestionsContent {
  topQuestions?: string[];
  questionsByCategory?: Record<string, string[]>;
}

/** Merge default questions with AI-generated ones. AI questions are added as custom and surfaced as "recommended". */
export function mergeDiscoveryQuestions(opts: {
  defaultQuestions: DiscoveryQuestionItem[];
  aiContent?: AiDiscoveryQuestionsContent | null;
}): {
  default: DiscoveryQuestionItem[];
  recommendedFromAi: string[];
  categories: { id: string; label: string }[];
} {
  const recommendedFromAi: string[] = [];
  if (opts.aiContent?.topQuestions?.length) {
    recommendedFromAi.push(...opts.aiContent.topQuestions);
  }
  if (opts.aiContent?.questionsByCategory) {
    for (const arr of Object.values(opts.aiContent.questionsByCategory)) {
      if (Array.isArray(arr)) recommendedFromAi.push(...arr);
    }
  }
  const categories = DISCOVERY_QUESTION_CATEGORIES.map((id) => ({
    id,
    label: getCategoryLabel(id),
  }));
  return {
    default: opts.defaultQuestions,
    recommendedFromAi: [...new Set(recommendedFromAi)],
    categories,
  };
}
