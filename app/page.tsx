"use client";

import Home from "@/pages/Home";

/**
 * Root route (/) – Landing page.
 * All landing sections are composed in app/pages/Home.tsx and live in app/sections/:
 *   HeroSection, ServicesSection, FreeSiteAuditPromoSection, AnnouncementsSection,
 *   Projects, AboutSection, SkillsSection, Blog, ContactSection.
 */
export default function HomePage() {
  return <Home />;
}
