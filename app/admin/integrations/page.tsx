"use client";

import { useEffect, useState, useCallback, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Link2,
  Calendar,
  Share2,
} from "lucide-react";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationId, IntegrationStatus } from "@/api/admin/integrations/types";

export default function AdminIntegrationsPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isSuperUser = isAuthSuperUser(user);

  const [services, setServices] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingId, setTestingId] = useState<IntegrationId | null>(null);
  const [testResult, setTestResult] = useState<{ id: IntegrationId; ok: boolean; message: string } | null>(null);
  const [gcalFlash, setGcalFlash] = useState<string | null>(null);
  const [gcalCalendarId, setGcalCalendarId] = useState("primary");
  const [gcalSaving, setGcalSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("gcal") === "connected") {
      setGcalFlash("Google Calendar connected. New bookings will create events on your calendar.");
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const err = q.get("gcal_error");
    if (err) {
      setGcalFlash(`Google Calendar: ${decodeURIComponent(err)}`);
      window.history.replaceState({}, "", "/admin/integrations");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (!authLoading && user && !isSuperUser) {
      router.push("/admin/dashboard");
    }
  }, [mounted, user, authLoading, router, isSuperUser]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/integrations/status", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || "Failed to load integrations");
      }
      setServices((data as { services?: IntegrationStatus[] }).services ?? []);
      const gcal = ((data as { services?: IntegrationStatus[] }).services ?? []).find(
        (x) => x.id === "google_calendar",
      );
      if (gcal?.configured) {
        try {
          const cr = await fetch("/api/admin/integrations/google-calendar/settings", { credentials: "include" });
          const cj = await cr.json().catch(() => ({}));
          if (typeof (cj as { calendarId?: string }).calendarId === "string") {
            setGcalCalendarId((cj as { calendarId: string }).calendarId);
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoading(true);
    void fetchStatus();
  }, [user, isSuperUser, fetchStatus]);

  async function disconnectGoogleCalendar() {
    if (!confirm("Disconnect Google Calendar? New bookings will not sync until you connect again.")) return;
    try {
      await apiRequest("POST", "/api/admin/integrations/google-calendar/disconnect");
      setGcalFlash("Google Calendar disconnected.");
      await fetchStatus();
    } catch (e) {
      setGcalFlash(e instanceof Error ? e.message : "Disconnect failed");
    }
  }

  async function saveGcalCalendarId() {
    setGcalSaving(true);
    try {
      await apiRequest("PATCH", "/api/admin/integrations/google-calendar/settings", {
        calendarId: gcalCalendarId.trim() || "primary",
      });
      setGcalFlash("Calendar target saved.");
    } catch (e) {
      setGcalFlash(e instanceof Error ? e.message : "Save failed");
    } finally {
      setGcalSaving(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setTestResult(null);
    fetchStatus();
  };

  const handleTest = async (id: IntegrationId) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/integrations/test", { service: id });
      const data = await res.json().catch(() => ({}));
      setTestResult({
        id,
        ok: data.ok === true,
        message: data.message ?? (res.ok ? "OK" : "Test failed"),
      });
    } catch {
      setTestResult({ id, ok: false, message: "Request failed" });
    } finally {
      setTestingId(null);
    }
  };

  const statusIcon = (s: IntegrationStatus) => {
    if (s.status === "ok") return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />;
    if (s.status === "error") return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  const statusBadge = (s: IntegrationStatus) => {
    const v = s.status === "ok" ? "default" : s.status === "error" ? "destructive" : "secondary";
    return (
      <Badge variant={v}>
        {s.status === "ok" ? "Connected" : s.status === "error" ? "Error" : "Not configured"}
      </Badge>
    );
  };

  if (!mounted || authLoading || (user && !isSuperUser)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-muted-foreground text-sm">
            Test and reconnect services used by Ascendra: Facebook App, email, and social posting.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Integrated services */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected services
          </CardTitle>
          <CardDescription>
            Status is based on environment variables. Use Test to verify; use Reconnect to open provider settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Could not load integrations. Ensure you are logged in as a super admin.
            </p>
          ) : (
            services.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-muted/20"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {statusIcon(s)}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      {statusBadge(s)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                    {s.message && (
                      <p className="text-xs text-muted-foreground mt-1">{s.message}</p>
                    )}
                    {testResult?.id === s.id && (
                      <p
                        className={`text-sm mt-2 ${testResult.ok ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
                      >
                        {testResult.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {s.connectHref ? (
                      <Button variant="default" size="sm" asChild>
                        <a href={s.connectHref}>Connect Google Calendar</a>
                      </Button>
                    ) : null}
                    {s.id === "google_calendar" && s.configured ? (
                      <Button variant="outline" size="sm" type="button" onClick={disconnectGoogleCalendar}>
                        Disconnect
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(s.id)}
                      disabled={testingId !== null}
                    >
                      {testingId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                    {s.reconnectUrl ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={s.reconnectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Google Cloud
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {s.id === "google_calendar" && s.configured ? (
                    <div className="flex flex-col gap-1 w-full sm:w-64">
                      <Label className="text-xs text-muted-foreground">Calendar ID (primary or email)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={gcalCalendarId}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setGcalCalendarId(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                          disabled={gcalSaving}
                          onClick={() => void saveGcalCalendarId()}
                        >
                          {gcalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Schedule posts to social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Schedule posts to social
          </CardTitle>
          <CardDescription>
            Publish or schedule content from Ascendra to Facebook, LinkedIn, and other platforms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">From the Blog</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create or edit a post in Admin → Blog, then publish now or set a date/time to schedule. Once social
                accounts are connected, scheduled posts can be pushed to Facebook and other platforms.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/admin/blog">Open Blog</Link>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ensure Facebook App (above) is configured and Valid OAuth Redirect URIs are set in the Facebook
            Developer Console so login and posting work. See Docs → FACEBOOK-APP-SETTINGS for the full checklist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
