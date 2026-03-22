"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageSEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

export default function ManageBookingPage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    guestName: string;
    guestEmail: string;
    status: string;
    startAt: string;
    endAt: string;
    bookingTypeName: string;
    timezone: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/scheduling/appointment/${encodeURIComponent(token)}`);
        const j = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(j.error || "Not found");
        setData(j.appointment);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function cancel() {
    if (!token) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/public/scheduling/cancel/${encodeURIComponent(token)}`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Cancel failed");
      setData((d) => (d ? { ...d, status: "cancelled" } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <PageSEO title="Your booking | Ascendra" description="View or cancel your scheduled meeting." canonicalPath="/book/manage" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
        <div className="container mx-auto px-3 sm:px-6 max-w-lg">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error || !data ? (
            <Card>
              <CardHeader>
                <CardTitle>Booking not found</CardTitle>
                <CardDescription>{error || "Check your link or contact Ascendra."}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/book">Back to booking</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your meeting</CardTitle>
                <CardDescription>
                  {data.bookingTypeName} · {data.status === "cancelled" ? "Cancelled" : "Confirmed"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {formatInTimeZone(new Date(data.startAt), data.timezone || "America/New_York", "EEEE, MMM d, yyyy h:mm a zzz")}
                </p>
                <p className="text-sm">
                  {data.guestName} · {data.guestEmail}
                </p>
                {data.status !== "cancelled" ? (
                  <Button variant="destructive" onClick={cancel} disabled={cancelling} className="w-full">
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel meeting"}
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/book">Book again</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
