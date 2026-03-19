/**
 * Site-wide nav/footer link config. Single source of truth to avoid server/client hydration mismatch.
 */

import {
  GROWTH_DIAGNOSIS_PATH,
  BRAND_GROWTH_PATH,
  FREE_GROWTH_TOOLS_PATH,
  STARTUP_GROWTH_KIT_PATH,
} from "@/lib/funnelCtas";

export const MAIN_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Your Growth Score", href: "/diagnosis/results" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const GROWTH_LINKS = [
  { label: "Growth Diagnosis", href: GROWTH_DIAGNOSIS_PATH },
  { label: "Brand Growth", href: BRAND_GROWTH_PATH },
  { label: "Ecosystem founders", href: "/ecosystem-founders" },
  { label: "Free growth tools", href: FREE_GROWTH_TOOLS_PATH },
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
