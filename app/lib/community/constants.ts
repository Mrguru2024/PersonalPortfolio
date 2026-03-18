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
