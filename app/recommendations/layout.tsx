import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "AI Project Recommendations | Find Your Perfect Project | Ascendra Technologies",
  description:
    "Get personalized project recommendations tailored to your interests, skills, and learning goals using our AI-powered recommendation engine.",
  path: "/recommendations",
  keywords: [
    "AI recommendations",
    "project finder",
    "personalized projects",
    "web development",
    "recommendation engine",
  ],
});

export default function RecommendationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="AI Project Recommendations | Find Your Perfect Project | Ascendra Technologies"
        description="Get personalized project recommendations tailored to your interests, skills, and learning goals using our AI-powered recommendation engine."
        path="/recommendations"
      />
      {children}
    </>
  );
}
