"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  formatCmsContentType,
  formatContentAttributionKind,
  formatFunnelStage,
  humanizeSnakeCase,
} from "@/lib/growth-os/friendlyCopy";

/** Mirrors `getLeadGenerationDashboard` JSON — client-only, avoids importing server code. */
export interface LeadGenDashboardPayload {
  projectKey: string;
  leadsBySource: { source: string; n: number }[];
  leadsByCampaign: { campaign: string; n: number }[];
  leadsByContentItem: Array<{
    kind: "internal_document" | "blog_post" | "calendar_entry";
    id: number;
    label: string;
    n: number;
    slug?: string;
  }>;
  leadsByUtmCampaign: { utmCampaign: string; n: number }[];
  conversionByOffer: { serviceInterest: string; n: number }[];
  conversionByCta: { cta: string; n: number }[];
  followUpCompletionRate: number | null;
}

export interface ContentDashboardPayload {
  projectKey: string;
  topPosts: Array<{
    id: number;
    title: string;
    slug: string;
    viewCount: number | null;
    publishedAt: Date | string | null;
  }>;
  topHeadlines: Array<{ title: string; n: number; source: "blog" | "internal_library" }>;
  topHookTypes: Array<{ contentType: string | null; n: number }>;
  topCtaPatterns: Array<{ pattern: string | null; n: number }>;
  bestPostingWindows: Array<{ hour: number; n: number }>;
  personaEngagementTrends: Array<{ persona: string; trend: string; n: number }>;
  funnelStageContentMix: Array<{ funnelStage: string; n: number }>;
}

export interface OperationalDashboardPayload {
  projectKey: string;
  scheduledPostsThisWeek: number;
  missedSchedules: number;
  staleDrafts: number;
  staleCampaigns: number;
  unreviewedAiSuggestions: number;
  auditIssuesUnresolved: number;
  followUpGaps: number;
  latestAuditRunId: number | null;
}

function CountTable({
  title,
  rows,
  labelKey,
  emptyMessage,
}: {
  title: string;
  rows: { label: string; n: number }[];
  labelKey: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <div className="max-h-40 overflow-auto rounded-md border border-border/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-2 py-1.5 font-normal">{labelKey}</th>
              <th className="px-2 py-1.5 font-normal text-right w-16">Leads</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="px-2 py-1.5 text-foreground break-words max-w-[200px]">{r.label}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatUtcHour(hour: number): string {
  const h = hour % 24;
  const label = `${String(h).padStart(2, "0")}:00`;
  return `${label} UTC`;
}

export function LeadGenerationDashboardPanel({ data }: { data: LeadGenDashboardPayload }) {
  const followPct =
    data.followUpCompletionRate == null
      ? null
      : Math.round(Number(data.followUpCompletionRate) * 100);

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {followPct == null ? (
          <span>No CRM tasks yet — completion rate appears once tasks exist.</span>
        ) : (
          <span>
            <strong className="text-foreground">{followPct}%</strong> of CRM tasks are marked complete (all
            time).
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CountTable
          title="Leads by source"
          labelKey="Source"
          emptyMessage="No CRM contacts yet."
          rows={data.leadsBySource.map((r) => ({ label: humanizeSnakeCase(r.source) || r.source, n: r.n }))}
        />
        <CountTable
          title="Deals by campaign field"
          labelKey="Campaign"
          emptyMessage="No deals with campaign data yet."
          rows={data.leadsByCampaign.map((r) => ({ label: r.campaign, n: r.n }))}
        />
      </div>

      <CountTable
        title="Deals by service interest"
        labelKey="Interest"
        emptyMessage="No deal service-interest breakdown yet."
        rows={data.conversionByOffer.map((r) => ({
          label: humanizeSnakeCase(r.serviceInterest) || r.serviceInterest,
          n: r.n,
        }))}
      />

      <CountTable
        title="Contacts by landing page (first-touch page)"
        labelKey="Page"
        emptyMessage="No landing-page breakdown yet."
        rows={data.conversionByCta.map((r) => ({ label: r.cta, n: r.n }))}
      />

      <CountTable
        title="Inferred from UTM campaign (contacts)"
        labelKey="UTM campaign"
        emptyMessage="No UTM campaign grouping yet."
        rows={data.leadsByUtmCampaign.map((r) => ({ label: r.utmCampaign, n: r.n }))}
      />

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Attributed leads by content piece</p>
        <p className="text-[11px] text-muted-foreground">
          Counts from explicit attribution — Content Studio, blog, or calendar entries linked to leads.
        </p>
        {data.leadsByContentItem.length === 0 ? (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            No attributed leads to content yet.
          </div>
        ) : (
          <div className="max-h-48 overflow-auto rounded-md border border-border/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-normal">Type</th>
                  <th className="px-2 py-1.5 font-normal">Title</th>
                  <th className="px-2 py-1.5 font-normal text-right w-14">Leads</th>
                </tr>
              </thead>
              <tbody>
                {data.leadsByContentItem.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <Badge variant="secondary" className="font-normal text-[10px]">
                        {formatContentAttributionKind(r.kind)}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5 text-foreground break-words max-w-[220px]">
                      {r.kind === "blog_post" && r.slug ? (
                        <Link
                          href={`/blog/${encodeURIComponent(r.slug)}`}
                          className="text-primary hover:underline underline-offset-2"
                        >
                          {r.label}
                        </Link>
                      ) : (
                        r.label
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function ContentPerformanceDashboardPanel({ data }: { data: ContentDashboardPayload }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Top published blog posts (by views)</p>
        {data.topPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No published blog posts yet.</p>
        ) : (
          <div className="max-h-44 overflow-auto rounded-md border border-border/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-normal">Title</th>
                  <th className="px-2 py-1.5 font-normal text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {data.topPosts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1.5">
                      <Link
                        href={`/blog/${encodeURIComponent(p.slug)}`}
                        className="text-primary hover:underline underline-offset-2 break-words"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                      {p.viewCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Content mix by funnel stage</p>
          {data.funnelStageContentMix.length === 0 ? (
            <p className="text-xs text-muted-foreground">No Content Studio documents for this project.</p>
          ) : (
            <ul className="max-h-36 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {data.funnelStageContentMix.map((r, i) => (
                <li key={i} className="flex justify-between gap-2 px-2 py-1.5">
                  <span className="text-foreground">{formatFunnelStage(r.funnelStage)}</span>
                  <span className="tabular-nums text-muted-foreground">{r.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Documents by content type</p>
          {data.topHookTypes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No type breakdown yet.</p>
          ) : (
            <ul className="max-h-36 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {data.topHookTypes.map((r, i) => (
                <li key={i} className="flex justify-between gap-2 px-2 py-1.5">
                  <span className="text-foreground">{formatCmsContentType(r.contentType)}</span>
                  <span className="tabular-nums text-muted-foreground">{r.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Best posting windows (editorial calendar)</p>
        <p className="text-[11px] text-muted-foreground">
          Hours (UTC) when the most posts are scheduled — use as a rough timing hint.
        </p>
        {data.bestPostingWindows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No scheduled calendar rows for this project.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.bestPostingWindows.map((w, i) => (
              <li key={i}>
                <Badge variant="outline" className="font-normal text-xs">
                  {formatUtcHour(w.hour)} · {w.n} scheduled
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Personas tagged on drafts & calendar</p>
        {data.personaEngagementTrends.length === 0 ? (
          <p className="text-xs text-muted-foreground">No persona tags in recent documents or calendar rows.</p>
        ) : (
          <ul className="max-h-32 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-xs">
            {data.personaEngagementTrends.map((r, i) => (
              <li key={i} className="flex justify-between gap-2 px-2 py-1.5">
                <span className="text-foreground font-medium">{r.persona}</span>
                <span className="tabular-nums text-muted-foreground">{r.n} tags</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Recent headlines & hooks (library)</p>
          {data.topHeadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground">None in the sample.</p>
          ) : (
            <ul className="max-h-36 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {data.topHeadlines.map((h, i) => (
                <li key={i} className="px-2 py-1.5">
                  <span className="text-foreground">{h.title}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] font-normal">
                    {h.source === "blog" ? "From blog list" : "Content Studio"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Common CTA lines (grouped title)</p>
          {data.topCtaPatterns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No CTA-type documents yet.</p>
          ) : (
            <ul className="max-h-36 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {data.topCtaPatterns.map((r, i) => (
                <li key={i} className="flex justify-between gap-2 px-2 py-1.5">
                  <span className="text-foreground break-words">{r.pattern ?? "—"}</span>
                  <span className="tabular-nums text-muted-foreground shrink-0">{r.n}×</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function OperationalDashboardPanel({ data }: { data: OperationalDashboardPayload }) {
  const metrics: { label: string; value: number; warn?: boolean }[] = [
    { label: "Posts scheduled this week", value: data.scheduledPostsThisWeek },
    {
      label: "Past-due calendar items still marked “scheduled”",
      value: data.missedSchedules,
      warn: data.missedSchedules > 0,
    },
    {
      label: "Stale drafts (no update in 21+ days)",
      value: data.staleDrafts,
      warn: data.staleDrafts > 0,
    },
    {
      label: "Stale draft campaigns (21+ days)",
      value: data.staleCampaigns,
      warn: data.staleCampaigns > 0,
    },
    { label: "AI content suggestions awaiting review", value: data.unreviewedAiSuggestions },
    {
      label: "Open recommendations (latest internal audit)",
      value: data.auditIssuesUnresolved,
      warn: data.auditIssuesUnresolved > 0,
    },
    {
      label: "Contacts with overdue follow-up date",
      value: data.followUpGaps,
      warn: data.followUpGaps > 0,
    },
  ];

  return (
    <div className="space-y-4 text-sm">
      <ul className="grid gap-2 sm:grid-cols-2">
        {metrics.map((m) => (
          <li
            key={m.label}
            className={`rounded-md border px-3 py-2 ${
              m.warn ? "border-amber-500/50 bg-amber-500/5" : "border-border/60 bg-muted/20"
            }`}
          >
            <p className="text-xs text-muted-foreground leading-snug">{m.label}</p>
            <p className="text-lg font-semibold tabular-nums text-foreground mt-0.5">{m.value}</p>
          </li>
        ))}
      </ul>
      {data.latestAuditRunId != null ? (
        <p className="text-xs text-muted-foreground">
          Latest completed audit run:{" "}
          <Link
            href={`/admin/internal-audit/${data.latestAuditRunId}`}
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            Open run #{data.latestAuditRunId}
          </Link>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No completed internal audit run on file for this filter.</p>
      )}
    </div>
  );
}
