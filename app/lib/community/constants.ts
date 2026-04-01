/**
 * AFN (Ascendra Founder Network) constants and enums.
 */

export const PROFILE_VISIBILITY = ["public", "private"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];

export const MESSAGE_PERMISSION = ["none", "collab_only", "allow"] as const;
export type MessagePermission = (typeof MESSAGE_PERMISSION)[number];

export const DISCUSSION_CATEGORY_SLUGS = [
  "startup-help",
  "getting-clients",
  "marketing-funnels",
  "ai-automation",
  "founder-mindset",
  "collaboration",
] as const;

export const DISCUSSION_CATEGORIES: { slug: string; name: string; description: string }[] = [
  { slug: "startup-help", name: "Startup Help", description: "Building and scaling your startup" },
  { slug: "getting-clients", name: "Getting Clients", description: "Lead gen, sales, and client acquisition" },
  { slug: "marketing-funnels", name: "Marketing & Funnels", description: "Marketing strategy and conversion" },
  { slug: "ai-automation", name: "AI & Automation", description: "Tools, AI, and workflow automation" },
  { slug: "founder-mindset", name: "Founder Mindset", description: "Mindset, habits, and leadership" },
  { slug: "collaboration", name: "Collaboration Board", description: "Find partners and collaborators" },
];

export const COLLAB_TYPES = [
  "looking_for_developer",
  "looking_for_designer",
  "looking_for_marketer",
  "looking_for_automation_help",
  "looking_for_partner",
  "offering_services",
  "networking",
] as const;
export type CollabType = (typeof COLLAB_TYPES)[number];

export const COLLAB_TYPE_LABELS: Record<CollabType, string> = {
  looking_for_developer: "Looking for developer",
  looking_for_designer: "Looking for designer",
  looking_for_marketer: "Looking for marketer",
  looking_for_automation_help: "Looking for automation help",
  looking_for_partner: "Looking for partner",
  offering_services: "Offering services",
  networking: "Networking",
};

export const BUSINESS_STAGES = [
  "idea",
  "pre_launch",
  "launched",
  "growing",
  "scaling",
  "established",
] as const;
export type BusinessStage = (typeof BUSINESS_STAGES)[number];

export const FOUNDER_TYPES = [
  "startup_founder",
  "small_business_owner",
  "freelancer",
  "consultant",
  "creative",
  "operator",
  "other",
] as const;
export type FounderType = (typeof FOUNDER_TYPES)[number];

/** User-facing labels for tribe / founder type (used in profiles, CRM, and suggestions). */
export const FOUNDER_TYPE_LABELS: Record<FounderType, string> = {
  startup_founder: "Startup founder",
  small_business_owner: "Small business owner",
  freelancer: "Freelancer / independent",
  consultant: "Consultant or advisor",
  creative: "Creative / maker",
  operator: "Operator / growth lead",
  other: "Other / prefer not to say",
};

export const PUBLIC_PROFILE_THEMES = [
  "classic",
  "ocean",
  "sunset",
  "forest",
  "violet",
  "midnight",
] as const;
export type PublicProfileTheme = (typeof PUBLIC_PROFILE_THEMES)[number];

export const PUBLIC_PROFILE_THEME_LABELS: Record<PublicProfileTheme, string> = {
  classic: "Clean & neutral",
  ocean: "Ocean calm",
  sunset: "Warm sunset",
  forest: "Forest growth",
  violet: "Bold violet",
  midnight: "Midnight focus",
};

/** CSS class bundles for public member pages (Tailwind). */
export const PUBLIC_PROFILE_THEME_CLASSES: Record<
  PublicProfileTheme,
  { card: string; accent: string; badge: string }
> = {
  classic: {
    card: "border-border/80 bg-card shadow-sm",
    accent: "text-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  ocean: {
    card: "border-cyan-500/25 bg-gradient-to-br from-cyan-950/35 via-card to-background shadow-md",
    accent: "text-cyan-400",
    badge: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  },
  sunset: {
    card: "border-orange-500/20 bg-gradient-to-br from-amber-950/40 via-card to-background shadow-md",
    accent: "text-amber-400",
    badge: "bg-orange-500/15 text-amber-100 border-orange-500/30",
  },
  forest: {
    card: "border-emerald-500/25 bg-gradient-to-br from-emerald-950/35 via-card to-background shadow-md",
    accent: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-100 border-emerald-500/30",
  },
  violet: {
    card: "border-violet-500/25 bg-gradient-to-br from-violet-950/45 via-card to-background shadow-md",
    accent: "text-violet-300",
    badge: "bg-violet-500/15 text-violet-100 border-violet-500/30",
  },
  midnight: {
    card: "border-slate-600/40 bg-gradient-to-br from-slate-950/80 via-slate-900/50 to-background shadow-lg",
    accent: "text-slate-200",
    badge: "bg-slate-700/50 text-slate-100 border-slate-500/40",
  },
};

export function isFounderType(value: string | null | undefined): value is FounderType {
  return !!value && (FOUNDER_TYPES as readonly string[]).includes(value);
}

export function isPublicProfileTheme(value: string | null | undefined): value is PublicProfileTheme {
  return !!value && (PUBLIC_PROFILE_THEMES as readonly string[]).includes(value);
}

/** Phase 1 — structured profile enums (extend without breaking older clients). */
export const COMMUNICATION_STYLES = ["async_first", "live_calls_ok", "mixed", "unspecified"] as const;
export type CommunicationStyle = (typeof COMMUNICATION_STYLES)[number];

export const CONTENT_PREFERENCES = ["concise", "detailed", "visual", "unspecified"] as const;
export type ContentPreference = (typeof CONTENT_PREFERENCES)[number];

export const ENGAGEMENT_STAGES = ["new", "exploring", "active", "deep", "mentor_led"] as const;
export type EngagementStage = (typeof ENGAGEMENT_STAGES)[number];

export const COMMUNITY_MATURITY_LEVELS = ["observer", "participant", "contributor", "leader"] as const;
export type CommunityMaturityLevel = (typeof COMMUNITY_MATURITY_LEVELS)[number];

export const MENTORSHIP_INTERESTS = ["none", "mentee", "mentor", "both"] as const;
export type MentorshipInterest = (typeof MENTORSHIP_INTERESTS)[number];

export const TIMELINE_LIVE_ACCESS_LEVELS = ["viewer", "active", "trusted", "featured"] as const;
export type TimelineLiveAccessLevel = (typeof TIMELINE_LIVE_ACCESS_LEVELS)[number];

export function isCommunicationStyle(v: string | null | undefined): v is CommunicationStyle {
  return !!v && (COMMUNICATION_STYLES as readonly string[]).includes(v);
}
export function isContentPreference(v: string | null | undefined): v is ContentPreference {
  return !!v && (CONTENT_PREFERENCES as readonly string[]).includes(v);
}
export function isEngagementStage(v: string | null | undefined): v is EngagementStage {
  return !!v && (ENGAGEMENT_STAGES as readonly string[]).includes(v);
}
export function isCommunityMaturityLevel(v: string | null | undefined): v is CommunityMaturityLevel {
  return !!v && (COMMUNITY_MATURITY_LEVELS as readonly string[]).includes(v);
}
export function isMentorshipInterest(v: string | null | undefined): v is MentorshipInterest {
  return !!v && (MENTORSHIP_INTERESTS as readonly string[]).includes(v);
}
export function isTimelineLiveAccessLevel(v: string | null | undefined): v is TimelineLiveAccessLevel {
  return !!v && (TIMELINE_LIVE_ACCESS_LEVELS as readonly string[]).includes(v);
}
