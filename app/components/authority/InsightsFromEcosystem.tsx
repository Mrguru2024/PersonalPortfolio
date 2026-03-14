import Link from "next/link";
import { PartnerInsight } from "./PartnerInsight";
import type { FounderProfile, PartnerInsightItem } from "@/lib/partnerFounders";
import { getFounderBySlug } from "@/lib/partnerFounders";

export interface InsightsFromEcosystemProps {
  /** One insight (e.g. for article/breakdown/audit page) or three (homepage) */
  insights: PartnerInsightItem[];
  /** Optional heading; default "Insights from the Ecosystem" */
  heading?: string;
  /** Optional subtext */
  subtext?: string;
  /** "card" (default) or "compact" */
  variant?: "card" | "compact";
  /** Link to full founders page */
  showFoundersLink?: boolean;
}

export function InsightsFromEcosystem({
  insights,
  heading = "Insights from the Ecosystem",
  subtext,
  variant = "card",
  showFoundersLink = true,
}: InsightsFromEcosystemProps) {
  if (insights.length === 0) return null;

  const withFounders = insights
    .map((insight) => {
      const founder = getFounderBySlug(insight.founderSlug);
      return founder ? { founder, insight } : null;
    })
    .filter((x): x is { founder: FounderProfile; insight: PartnerInsightItem } => x !== null);

  if (withFounders.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
        {subtext && (
          <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>
        )}
        {showFoundersLink && (
          <Link
            href="/ecosystem-founders"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Meet the founders
          </Link>
        )}
      </div>
      <div
        className={
          variant === "compact" && withFounders.length === 1
            ? "space-y-3"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        }
      >
        {withFounders.map(({ founder, insight }) => (
          <PartnerInsight
            key={insight.id}
            founder={founder}
            insight={insight}
            variant={withFounders.length === 1 ? "compact" : variant}
          />
        ))}
      </div>
    </section>
  );
}
