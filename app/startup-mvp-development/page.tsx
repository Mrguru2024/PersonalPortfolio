import { PersonaLandingPage } from "@/components/landing/PersonaLandingPage";

export default function StartupMvpDevelopmentPage() {
  return (
    <PersonaLandingPage
      slug="startup-mvp-development"
      persona="startup"
      title="Build Your MVP on a Scalable Foundation"
      subtitle="MVP delivery for founders who need launch speed today and architecture that supports tomorrow."
      heroDescription="For founders and product teams, we build MVPs with modern Next.js architecture, clean backend foundations, and a roadmap that supports post-launch growth."
      projectIds={["stackzen", "keycode-help", "portfolio-website"]}
      painPoints={[
        "Need to ship fast while keeping architecture scalable.",
        "Unclear scope causes delays and rework.",
        "Product decisions aren’t tied to measurable outcomes.",
        "Early technical shortcuts make future iterations expensive.",
      ]}
      outcomes={[
        "Faster MVP launch with a focused scope and execution plan.",
        "Stable architecture that supports growth and iteration.",
        "Feature prioritization tied to user and business impact.",
        "Better handoff and maintainability for ongoing development.",
      ]}
      serviceHighlights={[
        "MVP scope definition and technical planning",
        "Next.js + TypeScript product architecture",
        "API, auth, data modeling, and integrations",
        "Performance and observability foundations",
        "Post-launch iteration roadmap",
        "Developer-friendly documentation and handoff",
      ]}
      caseExamples={[
        {
          title: "MVP Launch Blueprint",
          summary:
            "Mapped feature priorities to a phased build plan, reducing launch delays and scope creep.",
        },
        {
          title: "Scalable Core Architecture",
          summary:
            "Built core services with maintainable patterns so future growth didn’t require a full rewrite.",
        },
        {
          title: "Post-Launch Iteration Loop",
          summary:
            "Set up event tracking and product feedback loops to prioritize high-impact improvements.",
        },
      ]}
    />
  );
}

