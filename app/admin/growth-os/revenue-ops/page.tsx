"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Phone, CreditCard, Link2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FinanceSnapshot {
  periodDays: number;
  periodStartIso: string;
  operatingCostLines: { key: string; label: string; monthlyCents: number; notes?: string }[];
  monthlyOperatingCostTotalCents: number;
  periodInternalCostCents: number;
  revenue: {
    paidInvoicesInPeriodCents: number;
    stripeTimelinePaymentsCents: number;
    manualLedgerRevenueCents: number;
    primaryRevenueCents: number;
  };
  costs: {
    manualLedgerCostCents: number;
    periodInternalCostCents: number;
    totalCostCents: number;
  };
  impliedNetCents: number;
  clientProjectRollups: {
    userId: number | null;
    clientLabel: string;
    paidInPeriodCents: number;
    outstandingCents: number;
    invoiceCount: number;
    quoteCount: number;
  }[];
  notes: string[];
}

interface DashboardPayload {
  totalLeads: number;
  leadsWithPhone: number;
  bookedLeads: number;
  contactedLeads: number;
  paymentsLogged: number;
  missedCalls7d: number;
  bookingClicks30d: number;
  topSources: { source: string; count: number }[];
  twilioSmsReady: boolean;
  stripeReady: boolean;
  stripeWebhookReady: boolean;
  bookingLinkSecretReady: boolean;
  finance: FinanceSnapshot;
}

function formatUsd(cents: number): string {
  const n = Number(cents) || 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n / 100);
}

export default function RevenueOpsPage() {
  const { data, isLoading, error } = useQuery<DashboardPayload>({
    queryKey: ["/api/admin/revenue-ops/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/revenue-ops/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load Revenue ops</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : "Unknown error"}</AlertDescription>
      </Alert>
    );
  }

  const bookingRate = data.totalLeads ? Math.round((data.bookedLeads / data.totalLeads) * 100) : 0;
  const contactRate = data.totalLeads ? Math.round((data.contactedLeads / data.totalLeads) * 100) : 0;
  const f = data.finance;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue ops</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Internal funnel health (contact → book → pay) plus a practical revenue / cost view: your operating model,
            paid invoices, Stripe timeline events, and manual or bank-fed ledger lines from settings.
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/admin/growth-os/revenue-ops/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {!data.twilioSmsReady && (
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertTitle>Twilio SMS</AlertTitle>
          <AlertDescription>
            Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID to enable
            outbound and inbound SMS logging.
          </AlertDescription>
        </Alert>
      )}
      {data.stripeReady && !data.stripeWebhookReady && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Stripe webhooks</AlertTitle>
          <AlertDescription>
            Add STRIPE_WEBHOOK_SECRET and point Stripe to <code className="text-xs">/api/webhooks/stripe</code> for
            automatic payment → CRM timeline updates (amounts flow into analytics when metadata is present).
          </AlertDescription>
        </Alert>
      )}
      {!data.bookingLinkSecretReady && (
        <Alert>
          <Link2 className="h-4 w-4" />
          <AlertTitle>Tracked booking links</AlertTitle>
          <AlertDescription>
            Set REVENUE_OPS_BOOKING_LINK_SECRET so SMS booking URLs can route through{" "}
            <code className="text-xs">/go/book/…</code> and log clicks on the lead timeline.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="finance-heading" className="space-y-4">
        <h2 id="finance-heading" className="text-lg font-semibold tracking-tight">
          Revenue, costs &amp; margin (reporting window)
        </h2>
        <p className="text-sm text-muted-foreground">
          Window: last {f.periodDays} days (from {new Date(f.periodStartIso).toLocaleDateString()}). Internal costs
          prorate your monthly operating model from{" "}
          <Link href="/admin/growth-os/revenue-ops/settings" className="text-primary underline-offset-2 hover:underline">
            Finance settings
          </Link>
          . This is management math, not GAAP — tune lines to match your books.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Primary revenue"
            valueLabel={formatUsd(f.revenue.primaryRevenueCents)}
            subtitle="Paid invoices + manual ledger (window)"
          />
          <MetricCard
            title="Stripe timeline (CRM)"
            valueLabel={formatUsd(f.revenue.stripeTimelinePaymentsCents)}
            subtitle="Webhook events; may overlap invoices"
          />
          <MetricCard
            title="Internal cost (allocated)"
            valueLabel={formatUsd(f.costs.periodInternalCostCents)}
            subtitle={`${formatUsd(f.monthlyOperatingCostTotalCents)}/mo model · prorated`}
          />
          <MetricCard
            title="Implied net (window)"
            valueLabel={formatUsd(f.impliedNetCents)}
            subtitle="Primary revenue − internal &amp; manual costs"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operating model (monthly)</CardTitle>
              <CardDescription>Sum {formatUsd(f.monthlyOperatingCostTotalCents)} / month before proration</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                {f.operatingCostLines.map((row) => (
                  <li key={row.key} className="flex justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                    <span className="text-muted-foreground min-w-0">
                      <span className="text-foreground font-medium block">{row.label}</span>
                      {row.notes ? <span className="text-xs">{row.notes}</span> : null}
                    </span>
                    <span className="tabular-nums shrink-0">{formatUsd(row.monthlyCents)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue bridge (window)</CardTitle>
              <CardDescription>How the primary total is built</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid invoices</span>
                <span className="tabular-nums">{formatUsd(f.revenue.paidInvoicesInPeriodCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manual / bank / Stripe report ledger</span>
                <span className="tabular-nums">{formatUsd(f.revenue.manualLedgerRevenueCents)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 font-medium">
                <span>Primary revenue</span>
                <span className="tabular-nums">{formatUsd(f.revenue.primaryRevenueCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manual ledger costs</span>
                <span className="tabular-nums">{formatUsd(f.costs.manualLedgerCostCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allocated internal costs</span>
                <span className="tabular-nums">{formatUsd(f.costs.periodInternalCostCents)}</span>
              </div>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 pt-2">
                {f.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="clients-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="clients-heading" className="text-lg font-semibold tracking-tight">
            Client billing (by portal user)
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/invoices">Open invoices</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid in window vs. outstanding</CardTitle>
            <CardDescription>
              Rolled up from client invoices; quote titles shown when linked. Rows without a user are “unassigned”
              invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {f.clientProjectRollups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border/60">
                      <th className="py-2 pr-3 font-medium">Client / quotes</th>
                      <th className="py-2 pr-3 font-medium tabular-nums">Paid ({f.periodDays}d)</th>
                      <th className="py-2 pr-3 font-medium tabular-nums">Outstanding</th>
                      <th className="py-2 font-medium tabular-nums">Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.clientProjectRollups.map((r, idx) => (
                      <tr key={`${idx}-${r.userId ?? "u"}-${r.invoiceCount}`} className="border-b border-border/40">
                        <td className="py-2 pr-3 max-w-[240px] truncate" title={r.clientLabel}>
                          {r.clientLabel}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">{formatUsd(r.paidInPeriodCents)}</td>
                        <td className="py-2 pr-3 tabular-nums">{formatUsd(r.outstandingCents)}</td>
                        <td className="py-2 tabular-nums">{r.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="funnel-heading" className="space-y-3">
        <h2 id="funnel-heading" className="text-lg font-semibold tracking-tight">
          Lead funnel
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total leads" value={data.totalLeads} subtitle="type = lead" />
          <MetricCard title="With phone" value={data.leadsWithPhone} subtitle="SMS-capable" />
          <MetricCard title="Contacted" value={data.contactedLeads} subtitle={`~${contactRate}% of leads`} />
          <MetricCard title="Booked (CRM)" value={data.bookedLeads} subtitle={`~${bookingRate}% booked_call_at set`} />
          <MetricCard title="Payments (30d)" value={data.paymentsLogged} subtitle="distinct leads w/ payment event" />
          <MetricCard title="Missed calls (7d)" value={data.missedCalls7d} subtitle="from Twilio voice webhook" />
          <MetricCard title="Booking clicks (30d)" value={data.bookingClicks30d} subtitle="tracked /go/book opens" />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead sources</CardTitle>
          <CardDescription>Coalesce UTM source and CRM source (top 8)</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topSources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.topSources.map((row) => (
                <li key={row.source} className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
                  <span className="font-medium truncate">{row.source}</span>
                  <span className="text-muted-foreground shrink-0">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Webhooks (Twilio)</CardTitle>
          <CardDescription>Configure in Twilio Console for this deployment</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground font-mono break-all">
          <p>
            <span className="text-foreground font-sans font-medium">Inbound SMS: </span>
            …/api/webhooks/twilio/sms
          </p>
          <p>
            <span className="text-foreground font-sans font-medium">Voice status (missed call): </span>
            …/api/webhooks/twilio/voice
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  valueLabel,
  subtitle,
}: {
  title: string;
  value?: number;
  valueLabel?: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">
          {valueLabel !== undefined ? valueLabel : value ?? "—"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground pt-0">{subtitle}</CardContent>
    </Card>
  );
}
