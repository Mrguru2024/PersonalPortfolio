import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildMarketingMetadata({
    title: "Portfolio project | Ascendra Technologies",
    description:
      "Web and product work from Ascendra Technologies—overview, stack, and live demo when available.",
    path: `/projects/${id}`,
    keywords: ["portfolio", "Ascendra", "web development", "case study"],
    ogType: "article",
  });
}

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <WebPageJsonLd
        title="Portfolio project | Ascendra Technologies"
        description="Web and product work from Ascendra Technologies—overview, stack, and live demo when available."
        path={`/projects/${id}`}
        schemaType="Article"
      />
      {children}
    </>
  );
}
