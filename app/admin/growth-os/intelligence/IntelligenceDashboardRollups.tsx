"use client";

import Link from "next/link";
import { format } from "date-fns";
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

function rowMatchesFilter(filterText: string | undefined, ...parts: (string | number | null | undefined)[]): boolean {
  const q = filterText?.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => String(p ?? "").toLowerCase().includes(q));
}

const dataRowClass =
  "border-b border-border/50 last:border-0 odd:bg-background even:bg-muted/40 hover:bg-primary/5 transition-colors";

function CountTable({
  title,
  rows,
  labelKey,
  emptyMessage,
  filterText,
}: {
  title: string;
  rows: { label: string; n: number }[];
  labelKey: string;
  emptyMessage: string;
  /** Client-side filter across label + count */
  filterText?: string;
}) {
  const filtered = filterText?.trim()
    ? rows.filter((r) => rowMatchesFilter(filterText, r.label, r.n))
    : rows;

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  if (filtered.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No rows match your filter.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <div className="rounded-md border border-border/60 overflow-x-auto">
        <table className="w-full text-xs min-w-0">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-3 py-2 font-normal">{labelKey}</th>
              <th className="px-3 py-2 font-normal text-right w-16">Leads</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={dataRowClass}>
                <td className="px-3 py-2 text-foreground break-words min-w-0 max-w-md xl:max-w-none">
                  {r.label}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.n}</td>
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

function formatBlogDate(iso: Date | string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export function LeadGenerationDashboardPanel({
  data,
  filterText,
}: {
  data: LeadGenDashboardPayload;
  filterText?: string;
}) {
  const leadsBySource = data.leadsBySource ?? [];
  const leadsByCampaign = data.leadsByCampaign ?? [];
  const leadsByContentItem = data.leadsByContentItem ?? [];
  const leadsByUtmCampaign = data.leadsByUtmCampaign ?? [];
  const conversionByOffer = data.conversionByOffer ?? [];
  const conversionByCta = data.conversionByCta ?? [];
  const contentFiltered = filterText?.trim()
    ? leadsByContentItem.filter((r) =>
        rowMatchesFilter(filterText, r.label, r.kind, formatContentAttributionKind(r.kind)),
      )
    : leadsByContentItem;

  const followPct =
    data.followUpCompletionRate == null
      ? null
      : Math.round(Number(data.followUpCompletionRate) * 100);

  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
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
          filterText={filterText}
          rows={leadsBySource.map((r) => ({ label: humanizeSnakeCase(r.source) || r.source, n: r.n }))}
        />
        <CountTable
          title="Deals by campaign field"
          labelKey="Campaign"
          emptyMessage="No deals with campaign data yet."
          filterText={filterText}
          rows={leadsByCampaign.map((r) => ({ label: r.campaign, n: r.n }))}
        />
      </div>

      <CountTable
        title="Deals by service interest"
        labelKey="Interest"
        emptyMessage="No deal service-interest breakdown yet."
        filterText={filterText}
        rows={conversionByOffer.map((r) => ({
          label: humanizeSnakeCase(r.serviceInterest) || r.serviceInterest,
          n: r.n,
        }))}
      />

      <CountTable
        title="Contacts by landing page (first-touch page)"
        labelKey="Page"
        emptyMessage="No landing-page breakdown yet."
        filterText={filterText}
        rows={conversionByCta.map((r) => ({ label: r.cta, n: r.n }))}
      />

      <CountTable
        title="Inferred from UTM campaign (contacts)"
        labelKey="UTM campaign"
        emptyMessage="No UTM campaign grouping yet."
        filterText={filterText}
        rows={leadsByUtmCampaign.map((r) => ({ label: r.utmCampaign, n: r.n }))}
      />

      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Attributed leads by content piece</p>
        <p className="text-[11px] text-muted-foreground">
          Counts from explicit attribution — Content Studio, blog, or calendar entries linked to leads.
        </p>
        {leadsByContentItem.length === 0 ? (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            No attributed leads to content yet.
          </div>
        ) : contentFiltered.length === 0 ? (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            No attributed rows match your filter.
          </div>
        ) : (
          <div className="rounded-md border border-border/60 overflow-x-auto">
            <table className="w-full text-xs min-w-0">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-normal">Type</th>
                  <th className="px-2 py-1.5 font-normal">Title</th>
                  <th className="px-2 py-1.5 font-normal text-right w-14">Leads</th>
                </tr>
              </thead>
              <tbody>
                {contentFiltered.map((r, i) => (
                  <tr key={i} className={dataRowClass}>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <Badge variant="secondary" className="font-normal text-[10px]">
                        {formatContentAttributionKind(r.kind)}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5 text-foreground break-words min-w-0 max-w-md xl:max-w-none">
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

export function ContentPerformanceDashboardPanel({
  data,
  filterText,
}: {
  data: ContentDashboardPayload;
  filterText?: string;
}) {
  const topPosts = data.topPosts ?? [];
  const topHeadlines = data.topHeadlines ?? [];
  const topHookTypes = data.topHookTypes ?? [];
  const topCtaPatterns = data.topCtaPatterns ?? [];
  const bestPostingWindows = data.bestPostingWindows ?? [];
  const personaEngagementTrends = data.personaEngagementTrends ?? [];
  const funnelStageContentMix = data.funnelStageContentMix ?? [];

  const postsFiltered = filterText?.trim()
    ? topPosts.filter((p) => rowMatchesFilter(filterText, p.title, p.slug, p.viewCount, formatBlogDate(p.publishedAt)))
    : topPosts;
  const funnelFiltered = filterText?.trim()
    ? funnelStageContentMix.filter((r) =>
        rowMatchesFilter(filterText, r.funnelStage, formatFunnelStage(r.funnelStage), r.n),
      )
    : funnelStageContentMix;
  const hooksFiltered = filterText?.trim()
    ? topHookTypes.filter((r) => rowMatchesFilter(filterText, r.contentType, formatCmsContentType(r.contentType), r.n))
    : topHookTypes;
  const windowsFiltered = filterText?.trim()
    ? bestPostingWindows.filter((w) => rowMatchesFilter(filterText, formatUtcHour(w.hour), w.n))
    : bestPostingWindows;
  const personaFiltered = filterText?.trim()
    ? personaEngagementTrends.filter((r) => rowMatchesFilter(filterText, r.persona, r.trend, r.n))
    : personaEngagementTrends;
  const headlinesFiltered = filterText?.trim()
    ? topHeadlines.filter((h) => rowMatchesFilter(filterText, h.title, h.source, h.n))
    : topHeadlines;
  const ctaFiltered = filterText?.trim()
    ? topCtaPatterns.filter((r) => rowMatchesFilter(filterText, r.pattern, r.n))
    : topCtaPatterns;

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">Top published blog posts (by views)</p>
        {topPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No published blog posts yet.</p>
        ) : postsFiltered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No posts match your filter.</p>
        ) : (
          <div className="rounded-md border border-border/60 overflow-x-auto">
            <table className="w-full text-xs min-w-0">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-normal">Title</th>
                  <th className="px-2 py-1.5 font-normal text-right whitespace-nowrap">Published</th>
                  <th className="px-2 py-1.5 font-normal text-right">Views</th>
                </tr>
              </thead>
              <tbody>
                {postsFiltered.map((p) => (
                  <tr key={p.id} className={dataRowClass}>
                    <td className="px-2 py-1.5">
                      <Link
                        href={`/blog/${encodeURIComponent(p.slug)}`}
                        className="text-primary hover:underline underline-offset-2 break-words"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {formatBlogDate(p.publishedAt)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Content mix by funnel stage</p>
          {funnelStageContentMix.length === 0 ? (
            <p className="text-xs text-muted-foreground">No Content Studio documents for this project.</p>
          ) : funnelFiltered.length === 0 ? (
            <p className="text-xs text-muted-foreground">No funnel rows match your filter.</p>
          ) : (
            <ul className="rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {funnelFiltered.map((r, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-2 px-2 py-1.5 odd:bg-background even:bg-muted/40 hover:bg-primary/5 transition-colors"
                >
                  <span className="text-foreground">{formatFunnelStage(r.funnelStage)}</span>
                  <span className="tabular-nums text-muted-foreground">{r.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Documents by content type</p>
          {topHookTypes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No type breakdown yet.</p>
          ) : hooksFiltered.length === 0 ? (
            <p className="text-xs text-muted-foreground">No content types match your filter.</p>
          ) : (
            <ul className="rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {hooksFiltered.map((r, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-2 px-2 py-1.5 odd:bg-background even:bg-muted/40 hover:bg-primary/5 transition-colors"
                >
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
        {bestPostingWindows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No scheduled calendar rows for this project.</p>
        ) : windowsFiltered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No posting windows match your filter.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {windowsFiltered.map((w, i) => (
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
        {personaEngagementTrends.length === 0 ? (
          <p className="text-xs text-muted-foreground">No persona tags in recent documents or calendar rows.</p>
        ) : personaFiltered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No personas match your filter.</p>
        ) : (
          <ul className="rounded-md border border-border/60 divide-y divide-border/50 text-xs">
            {personaFiltered.map((r, i) => (
              <li
                key={i}
                className="flex justify-between gap-2 px-2 py-1.5 odd:bg-background even:bg-muted/40 hover:bg-primary/5 transition-colors"
              >
                <span className="text-foreground font-medium">{r.persona}</span>
                <span className="tabular-nums text-muted-foreground">{r.n} tags</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Recent headlines & hooks (library)</p>
          {topHeadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground">None in the sample.</p>
          ) : headlinesFiltered.length === 0 ? (
            <p className="text-xs text-muted-foreground">No headlines match your filter.</p>
          ) : (
            <ul className="rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {headlinesFiltered.map((h, i) => (
                <li
                  key={i}
                  className="px-2 py-1.5 odd:bg-background even:bg-muted/40 hover:bg-primary/5 transition-colors"
                >
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
          {topCtaPatterns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No CTA-type documents yet.</p>
          ) : ctaFiltered.length === 0 ? (
            <p className="text-xs text-muted-foreground">No CTAs match your filter.</p>
          ) : (
            <ul className="rounded-md border border-border/60 divide-y divide-border/50 text-xs">
              {ctaFiltered.map((r, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-2 px-2 py-1.5 odd:bg-background even:bg-muted/40 hover:bg-primary/5 transition-colors"
                >
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

export function OperationalDashboardPanel({
  data,
  filterText,
}: {
  data: OperationalDashboardPayload;
  filterText?: string;
}) {
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

  const metricsFiltered = filterText?.trim()
    ? metrics.filter((m) => rowMatchesFilter(filterText, m.label, m.value))
    : metrics;

  return (
    <div className="space-y-5 text-sm">
      {metricsFiltered.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-md border border-border/60 bg-muted/30 px-3 py-2">
          No metrics match your filter.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {metricsFiltered.map((m) => (
            <li
              key={m.label}
              className={`rounded-md border px-3 py-2 transition-colors hover:bg-primary/5 ${
                m.warn ? "border-amber-500/50 bg-amber-500/5" : "border-border/60 bg-muted/20"
              }`}
            >
              <p className="text-xs text-muted-foreground leading-snug">{m.label}</p>
              <p className="text-lg font-semibold tabular-nums text-foreground mt-0.5">{m.value}</p>
            </li>
          ))}
        </ul>
      )}
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
