import { PersonaLandingPage } from "@/components/landing/PersonaLandingPage";

export default function LocalBusinessGrowthPage() {
  return (
    <PersonaLandingPage
      slug="local-business-growth"
      persona="local"
      title="Build a Website That Converts Local Intent Into Bookings"
      subtitle="Growth-focused website systems for clinics, gyms, consultants, legal teams, and local service brands."
      heroDescription="For local businesses scaling online, we combine conversion-focused design, analytics, and automation so your site drives qualified bookings instead of just traffic."
      projectIds={["stackzen", "web-development-services", "keycode-help"]}
      visualAssets={[
        {
          src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",
          alt: "Professional customer interaction in local business setting",
          caption: "Credibility-focused business interaction visuals",
        },
        {
          src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80",
          alt: "Team reviewing business dashboard metrics",
          caption: "Structured dashboard and conversion analytics style",
        },
        {
          src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
          alt: "Office planning and conversion strategy session",
          caption: "Polished SaaS-style planning and reporting visual",
        },
      ]}
      painPoints={[
        "Website traffic isn’t converting into appointments.",
        "No measurable funnel from click to booked call.",
        "Manual lead handling slows follow-up and increases drop-off.",
        "Unclear analytics make marketing decisions difficult.",
      ]}
      outcomes={[
        "Better conversion flow from landing pages to appointment actions.",
        "Improved lead quality from targeted page messaging.",
        "Data-backed decisions using clear funnel tracking.",
        "Automated handoff workflows that reduce response time.",
      ]}
      serviceHighlights={[
        "Offer-driven landing page and CTA architecture",
        "Appointment funnel UX optimization",
        "Email/SMS and CRM workflow automation",
        "GA4, event tracking, and conversion dashboards",
        "Local SEO technical improvements",
        "A/B-ready page components for ongoing optimization",
      ]}
      caseExamples={[
        {
          title: "Booking Funnel Cleanup",
          summary:
            "Simplified page hierarchy and CTA paths to reduce abandonment before appointment requests.",
        },
        {
          title: "Analytics Setup",
          summary:
            "Implemented conversion event tracking so campaign ROI and lead source performance became measurable.",
        },
        {
          title: "Automation Rollout",
          summary:
            "Added follow-up and lead-routing automation to increase speed-to-contact and reduce missed opportunities.",
        },
      ]}
    />
  );
}

