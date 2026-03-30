import type { Metadata } from "next";
import { SchedulingBookFlow } from "@/components/scheduling/SchedulingBookFlow";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildMarketingMetadata({
    title: `Book | ${slug} | Ascendra`,
    description: "Schedule a meeting with Ascendra. Pick a time and complete a short form.",
    path: `/book/${slug}`,
    keywords: ["book a call", "schedule", "Ascendra"],
  });
}

export default async function BookBySlugPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-background">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-5xl pb-16 pt-6">
        <SchedulingBookFlow bookingPageSlug={slug} />
      </div>
    </div>
  );
}
