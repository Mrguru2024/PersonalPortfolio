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
import type {
  ContentStudioSocialPayload,
  IntegrationId,
  IntegrationStatus,
} from "@/api/admin/integrations/types";

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
  const [socialFlash, setSocialFlash] = useState<string | null>(null);
  const [gcalCalendarId, setGcalCalendarId] = useState("primary");
  const [gcalSaving, setGcalSaving] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false);
  const [contentStudioSocial, setContentStudioSocial] = useState<ContentStudioSocialPayload | null>(null);

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
    const social = q.get("social");
    if (social === "facebook_connected") {
      setSocialFlash(
        "Facebook Page connected. In Content Studio → Calendar, pick the matching Facebook target (up to four Pages).",
      );
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (social === "linkedin_connected") {
      setSocialFlash("LinkedIn connected. Choose the matching calendar target when you run multiple profiles.");
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (social === "x_connected") {
      setSocialFlash("X account connected. Choose the matching calendar target when you run multiple accounts.");
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (social === "threads_connected") {
      setSocialFlash("Threads connected. Text posts use a short API delay; pick the right target on the calendar.");
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const socialErr = q.get("social_error");
    if (socialErr) {
      setSocialFlash(decodeURIComponent(socialErr));
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
      const payload = data as { services?: IntegrationStatus[]; contentStudioSocial?: ContentStudioSocialPayload };
      setServices(payload.services ?? []);
      setContentStudioSocial(payload.contentStudioSocial ?? null);
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

  async function disconnectSocialPath(path: string, body: object, confirmMsg: string, successMsg: string) {
    if (!confirm(confirmMsg)) return;
    setSocialBusy(true);
    try {
      await apiRequest("POST", path, body);
      setSocialFlash(successMsg);
      await fetchStatus();
    } catch (e) {
      setSocialFlash(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setSocialBusy(false);
    }
  }

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
            Test and reconnect services: Facebook Login, email, Google Calendar, and Content Studio social publishing
            (Facebook Page, LinkedIn, X, Threads — OAuth Connect or env fallbacks).
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

      {socialFlash ? (
        <p className="mb-4 text-sm rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground">{socialFlash}</p>
      ) : null}

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

      {/* Content Studio: where scheduling lives + how to “connect” pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Connect social pages for post scheduling
          </CardTitle>
          <CardDescription>
            Scheduling happens in <strong className="font-medium text-foreground">Content Studio → Calendar</strong>. Connect
            up to four accounts per network (Facebook Pages, LinkedIn, X, Threads) where OAuth is configured, or use env
            token fallbacks. Whitelist each callback URL in the provider developer console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button size="sm" asChild>
              <Link href="/admin/content-studio/calendar">Content Studio calendar</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/content-studio">Content Studio hub</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.facebook.com/docs/pages-api/posts" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1 inline" />
                Meta: Page posts API
              </a>
            </Button>
          </div>

          {contentStudioSocial ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 p-3 text-sm space-y-3">
              <p className="font-medium text-foreground">Whitelist these redirect URIs (exact match)</p>
              <p className="text-muted-foreground text-xs">
                Enable OAuth / Web login as each provider requires. Apex vs <code className="text-xs">www</code> and port must match.
              </p>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Facebook / Threads (Meta)</p>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                  {contentStudioSocial.facebookContentStudioRedirectUri}
                </code>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5 mt-1">
                  {contentStudioSocial.threadsContentStudioRedirectUri}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">LinkedIn</p>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                  {contentStudioSocial.linkedinContentStudioRedirectUri}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">X (OAuth 2.0)</p>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                  {contentStudioSocial.xContentStudioRedirectUri}
                </code>
              </div>
            </div>
          ) : null}

          {contentStudioSocial && (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium mb-2">Publishing channels (this deployment)</p>
              <ul className="text-sm space-y-4 text-muted-foreground">
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {contentStudioSocial.facebookCanAddConnection ? (
                      <Button size="sm" asChild>
                        <a href="/api/admin/integrations/social/facebook/start">
                          {contentStudioSocial.facebookOAuthConnected ? "Connect another Page" : "Connect Facebook Page"}
                        </a>
                      </Button>
                    ) : null}
                    {contentStudioSocial.facebookOAuthConnected && contentStudioSocial.facebookAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          void disconnectSocialPath(
                            "/api/admin/integrations/social/facebook/disconnect",
                            {},
                            "Disconnect all Facebook Pages? Env tokens still work if set.",
                            "All Facebook Pages disconnected.",
                          )
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all Pages"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {contentStudioSocial.facebookPage ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <strong className="text-foreground">Facebook Page</strong>
                      {contentStudioSocial.facebookOAuthConnected && contentStudioSocial.facebookAccounts.length > 0 ? (
                        <>
                          {" "}
                          —{" "}
                          <span className="text-foreground font-medium">
                            {contentStudioSocial.facebookAccounts.length} / {contentStudioSocial.facebookMaxConnections}
                          </span>{" "}
                          connected
                          <ul className="mt-2 space-y-2 list-none">
                            {contentStudioSocial.facebookAccounts.map((a) => (
                              <li
                                key={a.accountId}
                                className="flex flex-wrap items-center gap-2 justify-between rounded border border-border bg-background/50 px-2 py-1.5"
                              >
                                <span>
                                  <span className="text-foreground font-medium">{a.pageName}</span>{" "}
                                  <span className="text-xs text-muted-foreground">({a.pageId})</span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs shrink-0"
                                  disabled={socialBusy}
                                  onClick={() =>
                                    void disconnectSocialPath(
                                      "/api/admin/integrations/social/facebook/disconnect",
                                      { accountId: a.accountId },
                                      "Remove this Facebook Page from Content Studio?",
                                      "Facebook Page removed.",
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : contentStudioSocial.facebookPage ? (
                        <> — connected via server environment (token + Page ID)</>
                      ) : (
                        <> — use Connect Facebook Page or env vars below</>
                      )}
                    </span>
                  </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!contentStudioSocial.facebookOAuthAvailable ? (
                    <p>
                      Add <code className="text-xs">FACEBOOK_APP_ID</code> and{" "}
                      <code className="text-xs">FACEBOOK_APP_SECRET</code>, and register the Content Studio callback under
                      Valid OAuth Redirect URIs to enable the Connect button (see the highlighted URL above after you set
                      app keys).
                    </p>
                  ) : null}
                  <p>
                    Optional env fallback: <code className="text-xs">FACEBOOK_ACCESS_TOKEN</code> (
                    <code className="text-xs">META_ACCESS_TOKEN</code>) +{" "}
                    <code className="text-xs">FACEBOOK_PAGE_ID</code> (<code className="text-xs">META_PAGE_ID</code>).
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {contentStudioSocial.linkedinCanAddConnection ? (
                      <Button size="sm" asChild>
                        <a href="/api/admin/integrations/social/linkedin/start">
                          {contentStudioSocial.linkedinOAuthConnected ? "Connect another profile" : "Connect LinkedIn"}
                        </a>
                      </Button>
                    ) : null}
                    {contentStudioSocial.linkedinOAuthConnected && contentStudioSocial.linkedinAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          void disconnectSocialPath(
                            "/api/admin/integrations/social/linkedin/disconnect",
                            {},
                            "Disconnect all LinkedIn profiles? Env tokens still work if set.",
                            "All LinkedIn profiles disconnected.",
                          )
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all LinkedIn"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {contentStudioSocial.linkedin ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <strong className="text-foreground">LinkedIn</strong>
                        {contentStudioSocial.linkedinOAuthConnected && contentStudioSocial.linkedinAccounts.length > 0 ? (
                          <>
                            {" "}
                            —{" "}
                            <span className="text-foreground font-medium">
                              {contentStudioSocial.linkedinAccounts.length} / {contentStudioSocial.linkedinMaxConnections}
                            </span>{" "}
                            connected
                            <ul className="mt-2 space-y-2 list-none">
                              {contentStudioSocial.linkedinAccounts.map((a) => (
                                <li
                                  key={a.accountId}
                                  className="flex flex-wrap items-center gap-2 justify-between rounded border border-border bg-background/50 px-2 py-1.5"
                                >
                                  <span>
                                    <span className="text-foreground font-medium">{a.displayLabel}</span>{" "}
                                    <span className="text-xs text-muted-foreground">({a.authorUrn})</span>
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs shrink-0"
                                    disabled={socialBusy}
                                    onClick={() =>
                                      void disconnectSocialPath(
                                        "/api/admin/integrations/social/linkedin/disconnect",
                                        { accountId: a.accountId },
                                        "Remove this LinkedIn profile from Content Studio?",
                                        "LinkedIn profile removed.",
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : contentStudioSocial.linkedin ? (
                          <> — connected via server environment (token + author URN)</>
                        ) : (
                          <> — use Connect LinkedIn or env vars below</>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!contentStudioSocial.linkedinOAuthAvailable ? (
                    <p>
                      Add <code className="text-xs">LINKEDIN_CLIENT_ID</code> and{" "}
                      <code className="text-xs">LINKEDIN_CLIENT_SECRET</code>, then add the redirect URI from the box above to
                      your LinkedIn app.
                    </p>
                  ) : null}
                  <p>
                    Optional env fallback: <code className="text-xs">LINKEDIN_ACCESS_TOKEN</code> +{" "}
                    <code className="text-xs">LINKEDIN_AUTHOR_URN</code>.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {contentStudioSocial.xCanAddConnection ? (
                      <Button size="sm" asChild>
                        <a href="/api/admin/integrations/social/x/start">
                          {contentStudioSocial.xOAuthConnected ? "Connect another account" : "Connect X"}
                        </a>
                      </Button>
                    ) : null}
                    {contentStudioSocial.xOAuthConnected && contentStudioSocial.xAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          void disconnectSocialPath(
                            "/api/admin/integrations/social/x/disconnect",
                            {},
                            "Disconnect all X accounts? Env tokens still work if set.",
                            "All X accounts disconnected.",
                          )
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all X"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {contentStudioSocial.x ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <strong className="text-foreground">X (Twitter)</strong>
                        {contentStudioSocial.xOAuthConnected && contentStudioSocial.xAccounts.length > 0 ? (
                          <>
                            {" "}
                            —{" "}
                            <span className="text-foreground font-medium">
                              {contentStudioSocial.xAccounts.length} / {contentStudioSocial.xMaxConnections}
                            </span>{" "}
                            connected
                            <ul className="mt-2 space-y-2 list-none">
                              {contentStudioSocial.xAccounts.map((a) => (
                                <li
                                  key={a.accountId}
                                  className="flex flex-wrap items-center gap-2 justify-between rounded border border-border bg-background/50 px-2 py-1.5"
                                >
                                  <span>
                                    <span className="text-foreground font-medium">@{a.username}</span>
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs shrink-0"
                                    disabled={socialBusy}
                                    onClick={() =>
                                      void disconnectSocialPath(
                                        "/api/admin/integrations/social/x/disconnect",
                                        { accountId: a.accountId },
                                        "Remove this X account from Content Studio?",
                                        "X account removed.",
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : contentStudioSocial.x ? (
                          <> — connected via server environment (OAuth2 token)</>
                        ) : (
                          <> — use Connect X or env vars below</>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!contentStudioSocial.xOAuthAvailable ? (
                    <p>
                      Add <code className="text-xs">X_CLIENT_ID</code> and <code className="text-xs">X_CLIENT_SECRET</code>{" "}
                      (OAuth 2.0 app), user authentication on, and the callback URL from the box above.
                    </p>
                  ) : null}
                  <p>
                    Optional env fallback: <code className="text-xs">X_OAUTH2_ACCESS_TOKEN</code> (or{" "}
                    <code className="text-xs">TWITTER_*</code> variants).
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {contentStudioSocial.threadsCanAddConnection ? (
                      <Button size="sm" asChild>
                        <a href="/api/admin/integrations/social/threads/start">
                          {contentStudioSocial.threadsOAuthConnected ? "Connect another profile" : "Connect Threads"}
                        </a>
                      </Button>
                    ) : null}
                    {contentStudioSocial.threadsOAuthConnected && contentStudioSocial.threadsAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          void disconnectSocialPath(
                            "/api/admin/integrations/social/threads/disconnect",
                            {},
                            "Disconnect all Threads profiles? Env tokens still work if set.",
                            "All Threads profiles disconnected.",
                          )
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all Threads"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {contentStudioSocial.threads ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <strong className="text-foreground">Threads</strong>
                        {contentStudioSocial.threadsOAuthConnected && contentStudioSocial.threadsAccounts.length > 0 ? (
                          <>
                            {" "}
                            —{" "}
                            <span className="text-foreground font-medium">
                              {contentStudioSocial.threadsAccounts.length} / {contentStudioSocial.threadsMaxConnections}
                            </span>{" "}
                            connected
                            <ul className="mt-2 space-y-2 list-none">
                              {contentStudioSocial.threadsAccounts.map((a) => (
                                <li
                                  key={a.accountId}
                                  className="flex flex-wrap items-center gap-2 justify-between rounded border border-border bg-background/50 px-2 py-1.5"
                                >
                                  <span>
                                    <span className="text-foreground font-medium">
                                      {a.username ? `@${a.username}` : "Threads user"}
                                    </span>{" "}
                                    <span className="text-xs text-muted-foreground">({a.threadsUserId})</span>
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs shrink-0"
                                    disabled={socialBusy}
                                    onClick={() =>
                                      void disconnectSocialPath(
                                        "/api/admin/integrations/social/threads/disconnect",
                                        { accountId: a.accountId },
                                        "Remove this Threads profile from Content Studio?",
                                        "Threads profile removed.",
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : contentStudioSocial.threads ? (
                          <> — connected via server environment (token + user id)</>
                        ) : (
                          <> — use Connect Threads or env vars below (Meta Threads API)</>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!contentStudioSocial.threadsOAuthAvailable ? (
                    <p>
                      Add <code className="text-xs">THREADS_APP_ID</code> / <code className="text-xs">THREADS_APP_SECRET</code>{" "}
                      or reuse <code className="text-xs">FACEBOOK_APP_ID</code> /{" "}
                      <code className="text-xs">FACEBOOK_APP_SECRET</code> with Threads permissions; whitelist both Meta
                      callback URLs above.
                    </p>
                  ) : null}
                  <p>
                    Optional env fallback: <code className="text-xs">THREADS_ACCESS_TOKEN</code> +{" "}
                    <code className="text-xs">THREADS_USER_ID</code> (or <code className="text-xs">META_THREADS_*</code>).
                  </p>
                </li>
                <li className="flex items-center gap-2">
                  {contentStudioSocial.webhook ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <strong className="text-foreground">Webhook hub</strong> (Buffer / Make / Zapier-style) —{" "}
                    <code className="text-xs">CONTENT_STUDIO_PUBLISH_WEBHOOK_URL</code>
                  </span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Use <strong className="text-foreground">Refresh</strong> after changing env vars. Cron{" "}
                <code className="text-xs">/api/cron/content-studio-publish</code> needs <code className="text-xs">CRON_SECRET</code>{" "}
                in production. See <code className="text-xs">.env.example</code> (Content Studio section) and repo{" "}
                <code className="text-xs">Docs/setup/FACEBOOK-APP-SETTINGS.md</code>.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Blog scheduling (separate)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Admin → Blog can schedule publish times for site posts. That path is not the same as Content Studio social
                slots; use the calendar above for Facebook / LinkedIn / X / Threads via adapters.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/admin/blog">Open Blog</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
