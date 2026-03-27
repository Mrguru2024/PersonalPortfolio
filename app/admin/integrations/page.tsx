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
  Sparkles,
  X,
} from "lucide-react";
import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  ContentStudioSocialPayload,
  IntegrationId,
  IntegrationStatus,
} from "@/api/admin/integrations/types";
import { MAX_SOCIAL_CONNECTIONS_PER_PLATFORM } from "@shared/contentStudioSocialConstants";

type SocialFlashVariant = "success" | "destructive" | "info";
type CelebrationPlatform = "facebook" | "linkedin" | "x" | "threads";

const CELEBRATION_COPY: Record<
  CelebrationPlatform,
  { title: string; description: string }
> = {
  facebook: {
    title: "Facebook Page connected",
    description:
      "Your Page is ready for scheduled posts. In the content calendar, pick this Page when you create a post.",
  },
  linkedin: {
    title: "LinkedIn connected",
    description:
      "You can schedule to this profile. On the calendar, choose the right profile if you use more than one.",
  },
  x: {
    title: "X connected",
    description: "You can schedule to this account. On the calendar, pick this account for each post.",
  },
  threads: {
    title: "Threads connected",
    description: "Your Threads profile is ready. On the calendar, choose this profile when you schedule.",
  },
};

function oauthPathToProviderCopy(path: string): { name: string; description: string } {
  if (path.includes("/facebook/")) {
    return {
      name: "Facebook",
      description:
        "Sign in with the Meta account that runs your Page. Allow posting to the Page, then you’ll return here.",
    };
  }
  if (path.includes("/linkedin/")) {
    return {
      name: "LinkedIn",
      description: "Sign in to LinkedIn and allow this site to post for you. You’ll return here when it’s done.",
    };
  }
  if (path.includes("/threads/")) {
    return {
      name: "Threads",
      description: "Sign in with the Meta account tied to Threads and allow posting.",
    };
  }
  if (path.includes("/x/")) {
    return {
      name: "X",
      description: "Sign in to X and approve this site. You’ll return here when finished.",
    };
  }
  return {
    name: "their website",
    description: "You’ll sign in there and then come back here.",
  };
}

function integrationReconnectLabel(id: IntegrationId): string {
  switch (id) {
    case "google_calendar":
      return "Google Cloud";
    case "facebook":
      return "Meta";
    case "brevo":
      return "Brevo";
    case "zoom":
      return "Zoom";
    case "social-scheduling":
      return "Facebook help";
    case "calendly":
      return "Calendly";
    default:
      return "Open";
  }
}

function buildOfflineSocialPayload(baseUrl: string): ContentStudioSocialPayload {
  const base = baseUrl.replace(/\/$/, "");
  const max = MAX_SOCIAL_CONNECTIONS_PER_PLATFORM;
  return {
    facebookPage: false,
    facebookOAuthConnected: false,
    facebookOAuthAvailable: false,
    facebookAccounts: [],
    facebookMaxConnections: max,
    facebookCanAddConnection: true,
    facebookContentStudioRedirectUri: `${base}/api/admin/integrations/social/facebook/callback`,
    linkedin: false,
    linkedinOAuthConnected: false,
    linkedinOAuthAvailable: false,
    linkedinAccounts: [],
    linkedinMaxConnections: max,
    linkedinCanAddConnection: true,
    linkedinContentStudioRedirectUri: `${base}/api/admin/integrations/social/linkedin/callback`,
    x: false,
    xOAuthConnected: false,
    xOAuthAvailable: false,
    xAccounts: [],
    xMaxConnections: max,
    xCanAddConnection: true,
    xContentStudioRedirectUri: `${base}/api/admin/integrations/social/x/callback`,
    threads: false,
    threadsOAuthConnected: false,
    threadsOAuthAvailable: false,
    threadsAccounts: [],
    threadsMaxConnections: max,
    threadsCanAddConnection: true,
    threadsContentStudioRedirectUri: `${base}/api/admin/integrations/social/threads/callback`,
    webhook: false,
  };
}

export default function AdminIntegrationsPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isSuperUser = isAuthSuperUser(user);
  const { toast } = useToast();

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
  const [siteOrigin, setSiteOrigin] = useState("");
  const [facebookPickPages, setFacebookPickPages] = useState<{ id: string; name: string }[] | null>(null);
  const [facebookPickId, setFacebookPickId] = useState("");
  const [facebookPickLoading, setFacebookPickLoading] = useState(false);
  const [facebookPickSaving, setFacebookPickSaving] = useState(false);
  /** Which OAuth start URL is in flight (so only that button shows a spinner). */
  const [oauthStartPath, setOauthStartPath] = useState<string | null>(null);
  const [socialFlashVariant, setSocialFlashVariant] = useState<SocialFlashVariant>("info");
  const [gcalFlashVariant, setGcalFlashVariant] = useState<SocialFlashVariant>("info");
  const [celebration, setCelebration] = useState<{ open: boolean; platform: CelebrationPlatform }>({
    open: false,
    platform: "facebook",
  });
  const [oauthPrompt, setOauthPrompt] = useState<{ path: string } | null>(null);
  const [disconnectPrompt, setDisconnectPrompt] = useState<{
    path: string;
    body: object;
    title: string;
    description: string;
    successMsg: string;
  } | null>(null);
  const [gcalDisconnectOpen, setGcalDisconnectOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSiteOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("gcal") === "connected") {
      setGcalFlashVariant("success");
      setGcalFlash("Google Calendar connected. New bookings will create events on your calendar.");
      toast({
        title: "Google Calendar connected",
        description: "New bookings will sync as events on your linked calendar.",
      });
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const err = q.get("gcal_error");
    if (err) {
      const msg = decodeURIComponent(err);
      setGcalFlashVariant("destructive");
      setGcalFlash(`Google Calendar: ${msg}`);
      toast({ variant: "destructive", title: "Calendar connection issue", description: msg });
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const social = q.get("social");
    if (social === "facebook_connected") {
      setSocialFlashVariant("success");
      setSocialFlash("Facebook Page connected. On the content calendar, choose this Page when you schedule (you can add more Pages).");
      setCelebration({ open: true, platform: "facebook" });
      toast({
        title: "Facebook Page connected",
        description: "Pick this Page on the content calendar when you schedule a post.",
      });
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (social === "linkedin_connected") {
      setSocialFlashVariant("success");
      setSocialFlash("LinkedIn connected. If you use several profiles, pick the right one on the calendar.");
      setCelebration({ open: true, platform: "linkedin" });
      toast({
        title: "LinkedIn connected",
        description: "Pick the matching LinkedIn target on calendar entries if you use several profiles.",
      });
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (social === "x_connected") {
      setSocialFlashVariant("success");
      setSocialFlash("X account connected. If you use more than one account, pick the right one on the calendar.");
      setCelebration({ open: true, platform: "x" });
      toast({ title: "X connected", description: "Choose this X account on the calendar for each scheduled post." });
      window.history.replaceState({}, "", "/admin/integrations");
    }
    if (social === "threads_connected") {
      setSocialFlashVariant("success");
      setSocialFlash("Threads connected. Short text posts may take a moment to go live—pick the right profile on the calendar.");
      setCelebration({ open: true, platform: "threads" });
      toast({ title: "Threads connected", description: "On the calendar, choose this Threads profile for each post." });
      window.history.replaceState({}, "", "/admin/integrations");
    }
    const socialErr = q.get("social_error");
    if (socialErr) {
      const decoded = decodeURIComponent(socialErr);
      setSocialFlashVariant("destructive");
      setSocialFlash(decoded);
      toast({ variant: "destructive", title: "Connection didn’t finish", description: decoded });
      window.history.replaceState({}, "", "/admin/integrations");
    }
  }, [toast]);

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

  useEffect(() => {
    if (!mounted || !user || !isSuperUser || typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("facebook_pick") !== "1") return;
    let cancelled = false;
    setFacebookPickLoading(true);
    void (async () => {
      try {
        const r = await fetch("/api/admin/integrations/social/facebook/pending-pages", {
          credentials: "include",
        });
        const data = (await r.json().catch(() => ({}))) as {
          pages?: { id: string; name: string }[];
          message?: string;
        };
        if (cancelled) return;
        if (!r.ok) {
          const msg = typeof data.message === "string" ? data.message : "Could not load Facebook Pages to choose.";
          setSocialFlashVariant("destructive");
          setSocialFlash(msg);
          toast({ variant: "destructive", title: "Couldn’t load Pages", description: msg });
          window.history.replaceState({}, "", "/admin/integrations");
          setFacebookPickPages(null);
          return;
        }
        const pages = Array.isArray(data.pages) ? data.pages : [];
        if (pages.length === 0) {
          const msg = "No Facebook Pages to choose from. Try connecting again.";
          setSocialFlashVariant("destructive");
          setSocialFlash(msg);
          toast({ variant: "destructive", title: "No Pages found", description: msg });
          window.history.replaceState({}, "", "/admin/integrations");
          setFacebookPickPages(null);
          return;
        }
        setFacebookPickPages(pages);
        setFacebookPickId(pages[0]!.id);
      } finally {
        if (!cancelled) setFacebookPickLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, user, isSuperUser, toast]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/integrations/status", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || "Could not load this page. Try Refresh.");
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
      setContentStudioSocial(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const socialPayload =
    contentStudioSocial ?? (siteOrigin ? buildOfflineSocialPayload(siteOrigin) : null);

  async function startOAuthConnect(startPath: string) {
    setOauthStartPath(startPath);
    try {
      const res = await fetch(startPath, { credentials: "include", redirect: "manual" });
      if (res.status === 401 || res.status === 403) {
        const msg = "Super user session required.";
        setSocialFlashVariant("destructive");
        setSocialFlash(msg);
        toast({ variant: "destructive", title: "Sign-in required", description: msg });
        return;
      }
      if (res.status === 400) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        const msg =
          data.message ??
          "This connection isn’t set up yet. Add the app details in your site settings, then add the return link shown in the yellow box on this page.";
        setSocialFlashVariant("destructive");
        setSocialFlash(msg);
        toast({ variant: "destructive", title: "Can’t start connection", description: msg });
        return;
      }
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("Location");
        if (loc) {
          toast({
            title: "Opening sign-in…",
            description: "Finish signing in there—you’ll come back here automatically.",
          });
          window.location.assign(loc);
          return;
        }
      }
      const msg = "Something unexpected happened when starting the connection.";
      setSocialFlashVariant("destructive");
      setSocialFlash(msg);
      toast({ variant: "destructive", title: "Couldn’t start", description: msg });
    } catch {
      const msg = "Network error starting OAuth.";
      setSocialFlashVariant("destructive");
      setSocialFlash(msg);
      toast({ variant: "destructive", title: "Network error", description: msg });
    } finally {
      setOauthStartPath(null);
    }
  }

  async function completeFacebookPagePick() {
    if (!facebookPickId.trim()) return;
    setFacebookPickSaving(true);
    try {
      await apiRequest("POST", "/api/admin/integrations/social/facebook/complete-pick", {
        pageId: facebookPickId.trim(),
      });
      setFacebookPickPages(null);
      setFacebookPickId("");
      window.history.replaceState({}, "", "/admin/integrations");
      setSocialFlashVariant("success");
      setSocialFlash("Facebook Page connected. On the content calendar, pick this Page when you schedule.");
      setCelebration({ open: true, platform: "facebook" });
      toast({
        title: "Facebook Page saved",
        description: "Open the content calendar to schedule posts to this Page.",
      });
      await fetchStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save Page";
      setSocialFlashVariant("destructive");
      setSocialFlash(msg);
      toast({ variant: "destructive", title: "Could not save Page", description: msg });
    } finally {
      setFacebookPickSaving(false);
    }
  }

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoading(true);
    void fetchStatus();
  }, [user, isSuperUser, fetchStatus]);

  function openDisconnectSocial(opts: {
    path: string;
    body: object;
    title: string;
    description: string;
    successMsg: string;
  }) {
    setDisconnectPrompt(opts);
  }

  async function confirmDisconnectSocial() {
    const p = disconnectPrompt;
    if (!p) return;
    setDisconnectPrompt(null);
    setSocialBusy(true);
    try {
      await apiRequest("POST", p.path, p.body);
      setSocialFlashVariant("success");
      setSocialFlash(p.successMsg);
      toast({ title: "Disconnected", description: p.successMsg });
      await fetchStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Disconnect failed";
      setSocialFlashVariant("destructive");
      setSocialFlash(msg);
      toast({ variant: "destructive", title: "Disconnect failed", description: msg });
    } finally {
      setSocialBusy(false);
    }
  }

  async function confirmDisconnectGoogleCalendar() {
    setGcalDisconnectOpen(false);
    try {
      await apiRequest("POST", "/api/admin/integrations/google-calendar/disconnect");
      setGcalFlashVariant("success");
      setGcalFlash("Google Calendar disconnected.");
      toast({
        title: "Google Calendar disconnected",
        description: "You can connect again here anytime to sync new bookings.",
      });
      await fetchStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Disconnect failed";
      setGcalFlashVariant("destructive");
      setGcalFlash(msg);
      toast({ variant: "destructive", title: "Disconnect failed", description: msg });
    }
  }

  async function saveGcalCalendarId() {
    setGcalSaving(true);
    try {
      await apiRequest("PATCH", "/api/admin/integrations/google-calendar/settings", {
        calendarId: gcalCalendarId.trim() || "primary",
      });
      setGcalFlashVariant("success");
      setGcalFlash("Calendar target saved.");
      toast({ title: "Calendar saved", description: "New bookings will use this calendar ID." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setGcalFlashVariant("destructive");
      setGcalFlash(msg);
      toast({ variant: "destructive", title: "Save failed", description: msg });
    } finally {
      setGcalSaving(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setTestResult(null);
    void (async () => {
      await fetchStatus();
      toast({ title: "Status updated", description: "Loaded the latest integration status." });
    })();
  };

  const handleTest = async (id: IntegrationId) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/integrations/test", { service: id });
      const data = await res.json().catch(() => ({}));
      const ok = data.ok === true;
      const message = data.message ?? (res.ok ? "OK" : "Test failed");
      setTestResult({ id, ok, message });
      if (ok) {
        toast({ title: "Test passed", description: message });
      } else {
        toast({ variant: "destructive", title: "Test failed", description: message });
      }
    } catch {
      const message = "Request failed";
      setTestResult({ id, ok: false, message });
      toast({ variant: "destructive", title: "Test failed", description: message });
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
          <h1 className="text-2xl font-semibold">Connections &amp; email</h1>
          <p className="text-muted-foreground text-sm">
            See what’s hooked up, run a quick check, and connect social pages or Google Calendar. Messages at the top
            tell you when something worked or needs attention.
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

      {gcalFlash ? (
        <Alert
          variant={
            gcalFlashVariant === "destructive" ? "destructive" : gcalFlashVariant === "success" ? "success" : "info"
          }
          className="mb-4"
        >
          {gcalFlashVariant === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : gcalFlashVariant === "destructive" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <div>
            <div className="flex items-start justify-between gap-2">
              <AlertTitle>Google Calendar</AlertTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -mr-1"
                aria-label="Dismiss"
                onClick={() => setGcalFlash(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDescription>{gcalFlash}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      {socialFlash ? (
        <Alert
          variant={socialFlashVariant === "destructive" ? "destructive" : socialFlashVariant === "success" ? "success" : "info"}
          className="mb-4"
        >
          {socialFlashVariant === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : socialFlashVariant === "destructive" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <div>
            <div className="flex items-start justify-between gap-2">
              <AlertTitle>
                {socialFlashVariant === "success"
                  ? "Connection update"
                  : socialFlashVariant === "destructive"
                    ? "Something went wrong"
                    : "Notice"}
              </AlertTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 -mr-1"
                aria-label="Dismiss"
                onClick={() => {
                  setSocialFlash(null);
                  setSocialFlashVariant("info");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDescription>{socialFlash}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      {/* Integrated services */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Connected services
          </CardTitle>
          <CardDescription>
            This list comes from your site’s saved settings. Use Test for a quick check; use the link button to open
            each service’s own site if you need to change something there.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Could not load this list. Make sure you’re signed in with the site owner account, then tap Refresh.
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
                      <Button variant="outline" size="sm" type="button" onClick={() => setGcalDisconnectOpen(true)}>
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
                          {integrationReconnectLabel(s.id)}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {s.id === "google_calendar" && s.configured ? (
                    <div className="flex flex-col gap-1 w-full sm:w-64">
                      <Label className="text-xs text-muted-foreground">Which calendar to use (usually leave as primary)</Label>
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
            Connect social pages for scheduled posts
          </CardTitle>
          <CardDescription>
            Connect each network here (up to four per channel). This is separate from{" "}
            <Link href="/admin/deployment-env" className="underline font-medium text-foreground">
              live site settings
            </Link>
            . After connecting, open the{" "}
            <strong className="font-medium text-foreground">content calendar</strong> and pick the Page or profile for each
            post. If something is missing, you’ll get a short message after you tap Connect—then add the app details in your
            site settings and copy the{" "}
            <strong className="font-medium text-foreground">exact links</strong> from the yellow box into each service’s
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {facebookPickLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border border-border px-3 py-3">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Loading your Facebook Pages…
            </div>
          ) : null}
          {facebookPickPages && facebookPickPages.length > 0 ? (
            <div className="rounded-lg border border-primary/40 bg-primary/[0.06] dark:bg-primary/10 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Choose a Facebook Page to connect</p>
              <p className="text-xs text-muted-foreground">
                More than one Page is available. Pick the one you want for scheduled posts—you can add another later with
                “Connect another Page.”
              </p>
              <fieldset className="space-y-2">
                {facebookPickPages.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 cursor-pointer rounded-md border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-background"
                  >
                    <input
                      type="radio"
                      name="fb_page_pick"
                      className="accent-primary shrink-0"
                      checked={facebookPickId === p.id}
                      onChange={() => setFacebookPickId(p.id)}
                    />
                    <span className="text-sm min-w-0">
                      <span className="font-medium text-foreground">{p.name}</span>{" "}
                      <span className="text-xs text-muted-foreground">({p.id})</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={facebookPickSaving || !facebookPickId}
                  onClick={() => void completeFacebookPagePick()}
                >
                  {facebookPickSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect selected Page"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={facebookPickSaving}
                  onClick={() => {
                    setFacebookPickPages(null);
                    setFacebookPickId("");
                    window.history.replaceState({}, "", "/admin/integrations");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
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
                Facebook Page posting (Meta)
              </a>
            </Button>
          </div>

          {socialPayload ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 p-3 text-sm space-y-3">
              <p className="font-medium text-foreground">Copy these links into each service’s settings (exact match)</p>
              <p className="text-muted-foreground text-xs">
                Each site asks for a “return” or “callback” address—paste the line below that matches. The site address
                (<code className="text-xs">www</code> vs non-www, and port on local machines) must match what you use in the
                browser.
              </p>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Facebook &amp; Threads (Meta)</p>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                  {socialPayload.facebookContentStudioRedirectUri}
                </code>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5 mt-1">
                  {socialPayload.threadsContentStudioRedirectUri}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">LinkedIn</p>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                  {socialPayload.linkedinContentStudioRedirectUri}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">X</p>
                <code className="block text-xs break-all rounded border border-border bg-background px-2 py-1.5">
                  {socialPayload.xContentStudioRedirectUri}
                </code>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Preparing return links…
            </div>
          )}

          {socialPayload && (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium mb-2">Channels on this copy of the site</p>
              <ul className="text-sm space-y-4 text-muted-foreground">
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        (oauthStartPath !== null && oauthStartPath !== "/api/admin/integrations/social/facebook/start") ||
                        socialBusy ||
                        socialPayload.facebookAccounts.length >= socialPayload.facebookMaxConnections
                      }
                      onClick={() => setOauthPrompt({ path: "/api/admin/integrations/social/facebook/start" })}
                    >
                      {oauthStartPath === "/api/admin/integrations/social/facebook/start" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : socialPayload.facebookOAuthConnected ? (
                        "Connect another Page"
                      ) : (
                        "Connect Facebook Page"
                      )}
                    </Button>
                    {socialPayload.facebookOAuthConnected && socialPayload.facebookAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          openDisconnectSocial({
                            path: "/api/admin/integrations/social/facebook/disconnect",
                            body: {},
                            title: "Disconnect all Facebook Pages?",
                            description:
                              "OAuth-connected Pages will be removed from Content Studio. Env-based tokens (if any) can still work.",
                            successMsg: "All Facebook Pages disconnected.",
                          })
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all Pages"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {socialPayload.facebookPage ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <strong className="text-foreground">Facebook Page</strong>
                      {socialPayload.facebookOAuthConnected && socialPayload.facebookAccounts.length > 0 ? (
                        <>
                          {" "}
                          —{" "}
                          <span className="text-foreground font-medium">
                            {socialPayload.facebookAccounts.length} / {socialPayload.facebookMaxConnections}
                          </span>{" "}
                          connected
                          <ul className="mt-2 space-y-2 list-none">
                            {socialPayload.facebookAccounts.map((a) => (
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
                                    openDisconnectSocial({
                                      path: "/api/admin/integrations/social/facebook/disconnect",
                                      body: { accountId: a.accountId },
                                      title: "Remove this Facebook Page?",
                                      description: `${a.pageName} will no longer be available as a Content Studio target.`,
                                      successMsg: "Facebook Page removed.",
                                    })
                                  }
                                >
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : socialPayload.facebookPage ? (
                        <> — connected using saved keys on the server</>
                      ) : (
                        <> — tap Connect or ask your host about the options below</>
                      )}
                    </span>
                  </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!socialPayload.facebookOAuthAvailable ? (
                    <p>
                      If Connect doesn’t work, add your Meta app ID and secret in the site settings, then add the Facebook
                      link from the yellow box under Meta → allowed return addresses.
                    </p>
                  ) : null}
                  <p>
                    Advanced (hosting only): you can instead save a Page token and Page ID—see{" "}
                    <code className="text-xs">FACEBOOK_ACCESS_TOKEN</code> / <code className="text-xs">FACEBOOK_PAGE_ID</code>{" "}
                    in the example settings file.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        (oauthStartPath !== null &&
                          oauthStartPath !== "/api/admin/integrations/social/linkedin/start") ||
                        socialBusy ||
                        socialPayload.linkedinAccounts.length >= socialPayload.linkedinMaxConnections
                      }
                      onClick={() => setOauthPrompt({ path: "/api/admin/integrations/social/linkedin/start" })}
                    >
                      {oauthStartPath === "/api/admin/integrations/social/linkedin/start" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : socialPayload.linkedinOAuthConnected ? (
                        "Connect another profile"
                      ) : (
                        "Connect LinkedIn"
                      )}
                    </Button>
                    {socialPayload.linkedinOAuthConnected && socialPayload.linkedinAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          openDisconnectSocial({
                            path: "/api/admin/integrations/social/linkedin/disconnect",
                            body: {},
                            title: "Disconnect all LinkedIn profiles?",
                            description:
                              "OAuth profiles will be removed. Env-based LinkedIn tokens (if set) are unchanged.",
                            successMsg: "All LinkedIn profiles disconnected.",
                          })
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all LinkedIn"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {socialPayload.linkedin ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <strong className="text-foreground">LinkedIn</strong>
                        {socialPayload.linkedinOAuthConnected && socialPayload.linkedinAccounts.length > 0 ? (
                          <>
                            {" "}
                            —{" "}
                            <span className="text-foreground font-medium">
                              {socialPayload.linkedinAccounts.length} / {socialPayload.linkedinMaxConnections}
                            </span>{" "}
                            connected
                            <ul className="mt-2 space-y-2 list-none">
                              {socialPayload.linkedinAccounts.map((a) => (
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
                                      openDisconnectSocial({
                                        path: "/api/admin/integrations/social/linkedin/disconnect",
                                        body: { accountId: a.accountId },
                                        title: "Remove this LinkedIn profile?",
                                        description: `${a.displayLabel} will be disconnected from Content Studio.`,
                                        successMsg: "LinkedIn profile removed.",
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : socialPayload.linkedin ? (
                          <> — connected using saved keys on the server</>
                        ) : (
                          <> — tap Connect or see advanced options below</>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!socialPayload.linkedinOAuthAvailable ? (
                    <p>
                      Add your LinkedIn app ID and secret in the site settings, then paste the LinkedIn link from the yellow
                      box into your LinkedIn developer app.
                    </p>
                  ) : null}
                  <p>
                    Advanced: <code className="text-xs">LINKEDIN_ACCESS_TOKEN</code> +{" "}
                    <code className="text-xs">LINKEDIN_AUTHOR_URN</code> in the example settings file.
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        (oauthStartPath !== null && oauthStartPath !== "/api/admin/integrations/social/x/start") ||
                        socialBusy ||
                        socialPayload.xAccounts.length >= socialPayload.xMaxConnections
                      }
                      onClick={() => setOauthPrompt({ path: "/api/admin/integrations/social/x/start" })}
                    >
                      {oauthStartPath === "/api/admin/integrations/social/x/start" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : socialPayload.xOAuthConnected ? (
                        "Connect another account"
                      ) : (
                        "Connect X"
                      )}
                    </Button>
                    {socialPayload.xOAuthConnected && socialPayload.xAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          openDisconnectSocial({
                            path: "/api/admin/integrations/social/x/disconnect",
                            body: {},
                            title: "Disconnect all X accounts?",
                            description: "OAuth-connected X accounts will be removed. Env tokens (if any) stay as configured.",
                            successMsg: "All X accounts disconnected.",
                          })
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all X"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {socialPayload.x ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <strong className="text-foreground">X (Twitter)</strong>
                        {socialPayload.xOAuthConnected && socialPayload.xAccounts.length > 0 ? (
                          <>
                            {" "}
                            —{" "}
                            <span className="text-foreground font-medium">
                              {socialPayload.xAccounts.length} / {socialPayload.xMaxConnections}
                            </span>{" "}
                            connected
                            <ul className="mt-2 space-y-2 list-none">
                              {socialPayload.xAccounts.map((a) => (
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
                                      openDisconnectSocial({
                                        path: "/api/admin/integrations/social/x/disconnect",
                                        body: { accountId: a.accountId },
                                        title: "Remove this X account?",
                                        description: `@${a.username} will be disconnected from Content Studio.`,
                                        successMsg: "X account removed.",
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : socialPayload.x ? (
                          <> — connected using saved keys on the server</>
                        ) : (
                          <> — tap Connect or see advanced options below</>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!socialPayload.xOAuthAvailable ? (
                    <p>
                      Add your X app ID and secret in the site settings, turn on user sign-in for the app, and paste the X
                      link from the yellow box into X’s developer settings.
                    </p>
                  ) : null}
                  <p>
                    Advanced: access token names in the example settings file (<code className="text-xs">X_OAUTH2_*</code> /{" "}
                    <code className="text-xs">TWITTER_*</code>).
                  </p>
                </li>
                <li className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        (oauthStartPath !== null &&
                          oauthStartPath !== "/api/admin/integrations/social/threads/start") ||
                        socialBusy ||
                        socialPayload.threadsAccounts.length >= socialPayload.threadsMaxConnections
                      }
                      onClick={() => setOauthPrompt({ path: "/api/admin/integrations/social/threads/start" })}
                    >
                      {oauthStartPath === "/api/admin/integrations/social/threads/start" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : socialPayload.threadsOAuthConnected ? (
                        "Connect another profile"
                      ) : (
                        "Connect Threads"
                      )}
                    </Button>
                    {socialPayload.threadsOAuthConnected && socialPayload.threadsAccounts.length > 1 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={socialBusy}
                        onClick={() =>
                          openDisconnectSocial({
                            path: "/api/admin/integrations/social/threads/disconnect",
                            body: {},
                            title: "Disconnect all Threads profiles?",
                            description:
                              "OAuth Threads profiles will be removed. Env-based Threads vars (if set) are unchanged.",
                            successMsg: "All Threads profiles disconnected.",
                          })
                        }
                      >
                        {socialBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect all Threads"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {socialPayload.threads ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <strong className="text-foreground">Threads</strong>
                        {socialPayload.threadsOAuthConnected && socialPayload.threadsAccounts.length > 0 ? (
                          <>
                            {" "}
                            —{" "}
                            <span className="text-foreground font-medium">
                              {socialPayload.threadsAccounts.length} / {socialPayload.threadsMaxConnections}
                            </span>{" "}
                            connected
                            <ul className="mt-2 space-y-2 list-none">
                              {socialPayload.threadsAccounts.map((a) => (
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
                                      openDisconnectSocial({
                                        path: "/api/admin/integrations/social/threads/disconnect",
                                        body: { accountId: a.accountId },
                                        title: "Remove this Threads profile?",
                                        description:
                                          (a.username ? `@${a.username}` : "This profile") +
                                          " will be disconnected from Content Studio.",
                                        successMsg: "Threads profile removed.",
                                      })
                                    }
                                  >
                                    Remove
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : socialPayload.threads ? (
                          <> — connected using saved keys on the server</>
                        ) : (
                          <> — tap Connect or see advanced options below</>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="pl-6 text-xs border-l-2 border-border ml-1 space-y-1">
                  {!socialPayload.threadsOAuthAvailable ? (
                    <p>
                      Add Threads (or shared Meta) app details in the site settings, enable Threads posting in Meta, and add
                      both Meta links from the yellow box to the app.
                    </p>
                  ) : null}
                  <p>
                    Advanced: token + user id names in the example settings file (<code className="text-xs">THREADS_*</code>{" "}
                    / <code className="text-xs">META_THREADS_*</code>).
                  </p>
                </li>
                <li className="flex items-center gap-2">
                  {socialPayload.webhook ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <strong className="text-foreground">Automation webhook</strong> (tools like Zapier)—set{" "}
                    <code className="text-xs">CONTENT_STUDIO_PUBLISH_WEBHOOK_URL</code> in hosting if you use it
                  </span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Tap <strong className="text-foreground">Refresh</strong> after your host changes saved settings. In production,
                scheduled posts need a scheduler password (<code className="text-xs">CRON_SECRET</code>) set with your host.
                Your developer can use the example settings file and Facebook setup doc in the project.
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Blog timing (different from social)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Under Blog you can set when site articles go live. That is only for the blog—not the social post calendar
                above.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/admin/blog">Open Blog</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={celebration.open} onOpenChange={(open) => setCelebration((c) => ({ ...c, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-amber-500 shrink-0" aria-hidden />
              {CELEBRATION_COPY[celebration.platform].title}
            </DialogTitle>
            <DialogDescription className="text-base pt-1">
              {CELEBRATION_COPY[celebration.platform].description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setCelebration((c) => ({ ...c, open: false }))}>
              Stay on this page
            </Button>
            <Button type="button" asChild>
              <Link href="/admin/content-studio/calendar">Open Content Studio calendar</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={oauthPrompt !== null} onOpenChange={(open) => !open && setOauthPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Continue to {oauthPrompt ? oauthPathToProviderCopy(oauthPrompt.path).name : "sign in"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {oauthPrompt ? oauthPathToProviderCopy(oauthPrompt.path).description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                const path = oauthPrompt?.path;
                setOauthPrompt(null);
                if (path) void startOAuthConnect(path);
              }}
            >
              Continue to sign in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={disconnectPrompt !== null} onOpenChange={(open) => !open && setDisconnectPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{disconnectPrompt?.title ?? "Disconnect?"}</AlertDialogTitle>
            <AlertDialogDescription>{disconnectPrompt?.description ?? ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
              onClick={() => void confirmDisconnectSocial()}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={gcalDisconnectOpen} onOpenChange={setGcalDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
            <AlertDialogDescription>
              New bookings will no longer appear on your Google Calendar until you connect again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
              onClick={() => void confirmDisconnectGoogleCalendar()}
            >
              Disconnect calendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
