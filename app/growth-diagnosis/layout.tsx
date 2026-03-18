import type { Metadata } from "next";
import { PageSEO } from "@/components/SEO";

export const metadata: Metadata = {
  title: "Website Growth Diagnosis | Conversion & Visibility Audit",
  description:
    "Free website growth diagnosis. Get your Growth Readiness Score, performance and conversion audit, and clear next steps. Then schedule a human diagnosis for the deepest insight.",
};

export default function GrowthDiagnosisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageSEO
        title="Website Growth Diagnosis | Conversion & Visibility Audit"
        description="Get a clear picture of your site's performance, clarity, and growth opportunities. Free automated diagnosis, then book a human audit for custom strategy."
        canonicalPath="/growth-diagnosis"
      />
      {children}
    </>
  );
}
