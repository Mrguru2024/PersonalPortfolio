"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Phone, CreditCard, Link2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue ops</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Internal funnel health: contact → book → pay. Uses existing CRM, Twilio SMS, Stripe invoices, and activity
            timeline.
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
            automatic payment → CRM timeline updates.
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total leads" value={data.totalLeads} subtitle="type = lead" />
        <MetricCard title="With phone" value={data.leadsWithPhone} subtitle="SMS-capable" />
        <MetricCard title="Contacted" value={data.contactedLeads} subtitle={`~${contactRate}% of leads`} />
        <MetricCard title="Booked (CRM)" value={data.bookedLeads} subtitle={`~${bookingRate}% booked_call_at set`} />
        <MetricCard title="Payments (30d)" value={data.paymentsLogged} subtitle="distinct leads w/ payment event" />
        <MetricCard title="Missed calls (7d)" value={data.missedCalls7d} subtitle="from Twilio voice webhook" />
        <MetricCard title="Booking clicks (30d)" value={data.bookingClicks30d} subtitle="tracked /go/book opens" />
      </div>

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

function MetricCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground pt-0">{subtitle}</CardContent>
    </Card>
  );
}
