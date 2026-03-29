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
    <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl">
        <p className="text-sm text-muted-foreground mb-6">
          Secure booking powered by Ascendra Scheduler — you&apos;ll receive confirmation by email.
        </p>
        <SchedulingBookFlow bookingPageSlug={slug} />
      </div>
    </div>
  );
}
