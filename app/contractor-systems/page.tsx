import { PersonaLandingPage } from "@/components/landing/PersonaLandingPage";

export default function ContractorSystemsPage() {
  return (
    <PersonaLandingPage
      slug="contractor-systems"
      persona="contractor"
      title="Get More Service Calls From Your Website"
      subtitle="Contractor website and automation systems built to turn local traffic into estimate requests."
      heroDescription="For roofing, HVAC, plumbing, electrical, and other service trades: we build fast, mobile-first websites and automation systems that convert local traffic into booked jobs."
      projectIds={["ssi-met-repairs", "keycode-help", "portfolio-website"]}
      painPoints={[
        "Outdated websites that look untrustworthy on mobile.",
        "No follow-up automation after quote or contact form submissions.",
        "Low-quality leads and inconsistent project pipeline.",
        "No visibility into where leads are coming from.",
      ]}
      outcomes={[
        "Higher conversion rates from location and service pages.",
        "Faster lead response with automated form + SMS/email workflows.",
        "Clear attribution across calls, forms, and campaigns.",
        "More predictable monthly lead flow from organic and paid traffic.",
      ]}
      serviceHighlights={[
        "High-converting local service page architecture",
        "Quote funnel optimization (form UX + trust signals)",
        "Speed and Core Web Vitals performance upgrades",
        "CRM integration and lead routing automation",
        "Call tracking + conversion event setup",
        "Technical SEO for service-area visibility",
      ]}
      caseExamples={[
        {
          title: "Lead Funnel Rebuild",
          summary:
            "Restructured a trades website into service-intent pages with clearer CTAs and saw stronger inbound lead quality.",
        },
        {
          title: "Automation Layer",
          summary:
            "Connected contact forms to instant notifications and follow-up sequences so no estimate request was missed.",
        },
        {
          title: "Mobile Conversion Fix",
          summary:
            "Improved mobile performance and reduced friction in the inquiry flow to increase completed submissions.",
        },
      ]}
    />
  );
}

