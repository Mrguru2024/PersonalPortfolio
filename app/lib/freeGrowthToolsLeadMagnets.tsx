import type { LucideIcon } from "lucide-react";
import { Search, Calculator, Gauge, BarChart3, Layout, BookOpen, Sparkles } from "lucide-react";
import {
  STARTUP_GROWTH_KIT_PATH,
  STARTUP_WEBSITE_SCORE_PATH,
  GROWTH_DIAGNOSIS_ENGINE_PATH,
  DIGITAL_GROWTH_AUDIT_PATH,
} from "@/lib/funnelCtas";

export interface FreeGrowthToolMagnet {
  id: string;
  title: string;
  who: string;
  problem: string;
  get: string;
  cta: string;
  href: string;
  icon: LucideIcon;
}

export const LEAD_MAGNETS: FreeGrowthToolMagnet[] = [
  {
    id: "growth-diagnosis",
    title: "Website growth diagnosis",
    who: "Business owners who want a clear, automated audit of their site's performance and conversion readiness.",
    problem: "You want to see where your site stands without waiting for a human review.",
    get: "An automated scan and Growth Readiness Score: performance, SEO, conversion, trust, and mobile. Plus top blockers and quick wins.",
    cta: "Run free diagnosis",
    href: GROWTH_DIAGNOSIS_ENGINE_PATH,
    icon: Sparkles,
  },
  {
    id: "audit",
    title: "Digital growth audit",
    who: "Business owners ready for a tailored review and clear next steps.",
    problem: "You're not sure what's holding you back or what to fix first.",
    get: "A straight-talk review of brand clarity, visual trust, and website conversion—with recommended next steps.",
    cta: "Get your free audit",
    href: "/digital-growth-audit",
    icon: Search,
  },
  {
    id: "revenue-calculator",
    title: "Website revenue loss calculator",
    who: "Anyone feeling pain from poor site performance and missed opportunities.",
    problem: "You suspect your site is costing you leads and revenue but don't know how much.",
    get: "A framework to think through lost traffic, conversion gaps, and opportunity cost—plus a path to fix it.",
    cta: "Use the calculator",
    href: "/website-revenue-calculator",
    icon: Calculator,
  },
  {
    id: "performance-score",
    title: "Website performance score",
    who: "Visitors curious how strong or weak their site is.",
    problem: "You want an honest view of where your site stands on clarity, trust, and conversion.",
    get: "A structured review of how your site scores on key areas—and what to improve first.",
    cta: "See the score",
    href: "/website-performance-score",
    icon: Gauge,
  },
  {
    id: "competitor-snapshot",
    title: "Competitor position snapshot",
    who: "Business owners worried about losing work to competitors or blending in.",
    problem: "You don't know how you show up next to others in your space.",
    get: "A structured snapshot of brand position, visual trust, conversion readiness, and market opportunity questions.",
    cta: "Get my snapshot",
    href: "/competitor-position-snapshot",
    icon: BarChart3,
  },
  {
    id: "homepage-blueprint",
    title: "Homepage conversion blueprint",
    who: "Anyone who knows their site is unclear and wants a structure to fix it.",
    problem: "Your homepage doesn't clearly turn visitors into leads.",
    get: "A practical blueprint: the sections, messaging, and conversion elements most homepages are missing—plus a self-check.",
    cta: "View the blueprint",
    href: "/homepage-conversion-blueprint",
    icon: Layout,
  },
  {
    id: "startup-growth-kit",
    title: "Startup growth kit",
    who: "New business owners building a business online with little or no budget.",
    problem: "You're not sure where to begin or how to grow without a big agency budget.",
    get: "Educational guide: why most startup websites fail, assets vs systems, the 4 layers of online growth, and a simple roadmap.",
    cta: "Read the kit",
    href: STARTUP_GROWTH_KIT_PATH,
    icon: BookOpen,
  },
  {
    id: "startup-website-score",
    title: "Startup website score",
    who: "Founders who want to know if their site is ready to capture leads.",
    problem: "You don't know how your website stacks up on clarity, trust, and conversion.",
    get: "A simple questionnaire and readiness score (0–100) with improvement suggestions and a path to your Startup Action Plan.",
    cta: "Get my score",
    href: STARTUP_WEBSITE_SCORE_PATH,
    icon: Sparkles,
  },
];

/** Cards already featured in the priority strip — keep them only there. */
export const MORE_LEAD_MAGNETS = LEAD_MAGNETS.filter(
  (m) => m.href !== GROWTH_DIAGNOSIS_ENGINE_PATH && m.href !== DIGITAL_GROWTH_AUDIT_PATH,
);
