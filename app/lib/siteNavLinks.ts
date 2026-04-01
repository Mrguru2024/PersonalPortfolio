/**
 * Site-wide nav/footer link config. Single source of truth to avoid server/client hydration mismatch.
 */

import {
  BRAND_GROWTH_PATH,
  FREE_GROWTH_TOOLS_PATH,
  STARTUP_GROWTH_KIT_PATH,
  FREE_TRIAL_PATH,
  CHALLENGE_LANDING_PATH,
  GROWTH_DIAGNOSIS_ENGINE_PATH,
  DIGITAL_GROWTH_AUDIT_PATH,
  PPC_LEAD_MAGNET_PATH,
  DIAGNOSTICS_HUB_PATH,
  PROJECT_GROWTH_ASSESSMENT_PATH,
  GROWTH_PLATFORM_PATH,
  PERSONA_JOURNEY_PATH,
  MARKET_SCORE_PATH,
  COMMUNITY_HUB_PUBLIC_PATH,
} from "@/lib/funnelCtas";

export const MAIN_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Free tools hub", href: FREE_GROWTH_TOOLS_PATH },
  { label: "Choose your diagnosis", href: DIAGNOSTICS_HUB_PATH },
  { label: "Free trial", href: FREE_TRIAL_PATH },
  { label: "About", href: "/about" },
  { label: "Community", href: COMMUNITY_HUB_PUBLIC_PATH },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Updates", href: "/updates" },
  { label: "Your Growth Score", href: "/diagnosis/results" },
  { label: "Contact", href: "/contact" },
] as const;

export const GROWTH_LINKS = [
  { label: "Choose your diagnosis", href: DIAGNOSTICS_HUB_PATH },
  { label: "Growth System Platform", href: GROWTH_PLATFORM_PATH },
  { label: "Find your path", href: PERSONA_JOURNEY_PATH },
  { label: "Market Score", href: MARKET_SCORE_PATH },
  { label: "Free diagnosis", href: GROWTH_DIAGNOSIS_ENGINE_PATH },
  { label: "Free audit", href: DIGITAL_GROWTH_AUDIT_PATH },
  { label: "PPC & lead systems", href: PPC_LEAD_MAGNET_PATH },
  { label: "Free toolkit", href: FREE_GROWTH_TOOLS_PATH },
  { label: "AI image studio", href: "/generate-images" },
  { label: "5-day challenge (paid)", href: CHALLENGE_LANDING_PATH },
  { label: "Growth assessment (full)", href: PROJECT_GROWTH_ASSESSMENT_PATH },
  { label: "Brand Growth", href: BRAND_GROWTH_PATH },
  { label: "About the ecosystem", href: "/about" },
  { label: "Startup growth kit", href: STARTUP_GROWTH_KIT_PATH },
  { label: "Our work", href: "/partners/ascendra-technologies#projects" },
] as const;

export const WHO_WE_SERVE_LINKS = [
  { label: "For Contractors", href: "/contractor-systems" },
  { label: "Local Business", href: "/local-business-growth" },
  { label: "Startup MVP", href: "/startup-mvp-development" },
] as const;

export const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Request data deletion", href: "/data-deletion-request" },
] as const;
