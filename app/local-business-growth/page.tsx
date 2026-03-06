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

