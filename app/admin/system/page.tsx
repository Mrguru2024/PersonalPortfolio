"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Trash2,
  AlertCircle,
  Activity,
  ChevronRight,
  FileCode,
  Database,
  CheckCircle2,
  XCircle,
  Download,
  User,
  FileCheck,
  Contact,
  ScrollText,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isSuperAdminUser } from "@/lib/super-admin";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HealthData {
  db: "ok" | "error";
  errorMessage?: string;
  counts: Record<string, number>;
  config: Record<string, boolean>;
  logStats: { total: number; errors: number };
  nodeEnv: string;
}

interface ActivityData {
  recentContacts: { id: number; name: string; email: string; subject: string; createdAt: string }[];
  recentAssessments: { id: number; name: string; email: string; status: string; createdAt: string }[];
  recentCrmContacts: { id: number; name: string; email: string; source: string; createdAt: string }[];
}

interface FixHint {
  file?: string;
  line?: number;
  column?: number;
  snippet?: string;
}

interface LogEntryWithFix {
  id: string;
  type: "error" | "activity";
  message: string;
  stack?: string;
  route?: string;
  url?: string;
  method?: string;
  status?: number;
  userId?: string;
  timestamp: number;
  context?: Record<string, unknown>;
  fixHint?: FixHint[];
}

interface ActivityLogEntry {
  id: number;
  userId: number | null;
  username: string | null;
  eventType: string;
  success: boolean;
  message: string | null;
  identifier: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminSystemPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isSuperUser = isSuperAdminUser(user ?? null);

  const [logs, setLogs] = useState<LogEntryWithFix[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityLogEntries, setActivityLogEntries] = useState<ActivityLogEntry[]>([]);
  const [loadingActivityLog, setLoadingActivityLog] = useState(false);
  const [activityLogFilter, setActivityLogFilter] = useState<string>("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setMounted(true);
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

  const fetchLogs = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/system/logs?limit=200");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load logs");
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoading(true);
    fetchLogs();
  }, [user, isSuperUser]);

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoadingHealth(true);
    apiRequest("GET", "/api/admin/system/health")
      .then((r) => r.ok ? r.json() : null)
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoadingHealth(false));
  }, [user, isSuperUser, refreshTick]);

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoadingActivity(true);
    apiRequest("GET", "/api/admin/system/activity?limit=5")
      .then((r) => r.ok ? r.json() : null)
      .then(setActivity)
      .catch(() => setActivity(null))
      .finally(() => setLoadingActivity(false));
  }, [user, isSuperUser, refreshTick]);

  useEffect(() => {
    if (!user || !isSuperUser) return;
    setLoadingActivityLog(true);
    const url = activityLogFilter
      ? `/api/admin/system/activity-log?limit=100&eventType=${encodeURIComponent(activityLogFilter)}`
      : "/api/admin/system/activity-log?limit=100";
    apiRequest("GET", url)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setActivityLogEntries(data.entries ?? []))
      .catch(() => setActivityLogEntries([]))
      .finally(() => setLoadingActivityLog(false));
  }, [user, isSuperUser, refreshTick, activityLogFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
    setRefreshTick((t) => t + 1);
  };

  const handleClear = async () => {
    if (!confirm("Clear all system logs? This cannot be undone.")) return;
    setClearing(true);
    try {
      const res = await apiRequest("POST", "/api/admin/system/logs", {
        action: "clear",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to clear logs");
      }
      setLogs([]);
    } finally {
      setClearing(false);
    }
  };

  const handleDownloadLogs = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/system/logs?limit=500");
      if (!res.ok) return;
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.logs ?? [], null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  if (!mounted || authLoading || (user && !isSuperUser)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">System monitor</h1>
          <p className="text-muted-foreground text-sm">
            Errors, activity, and fix hints for 5epmgllc super admin. In-memory logs (per instance).
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadLogs}
          disabled={logs.length === 0}
        >
          <Download className="h-4 w-4" />
          <span className="ml-2">Download logs</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={clearing || logs.length === 0}
        >
          {clearing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="ml-2">Clear logs</span>
        </Button>
      </div>

      {/* Health & overview */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Health & config
            </CardTitle>
            <CardDescription>DB status, counts, and env config (keys only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingHealth ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : health ? (
              <>
                <div className="flex items-center gap-2">
                  {health.db === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium">Database: {health.db}</span>
                  {health.errorMessage && (
                    <span className="text-xs text-destructive truncate" title={health.errorMessage}>
                      {health.errorMessage}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(health.counts).map(([k, v]) => (
                    <Badge key={k} variant="secondary">{k}: {v}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Config: {Object.entries(health.config).filter(([, v]) => v).length} / {Object.keys(health.config).length} keys set
                  <ul className="mt-1 space-y-0.5">
                    {Object.entries(health.config).map(([key, set]) => (
                      <li key={key} className="flex items-center gap-1">
                        {set ? <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600" /> : <XCircle className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        <span>{key}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs">Logs: {health.logStats.total} total, {health.logStats.errors} errors · {health.nodeEnv}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load health</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent activity
            </CardTitle>
            <CardDescription>Latest form submissions and CRM entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingActivity ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : activity ? (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Contacts</p>
                  {activity.recentContacts.length === 0 ? (
                    <p className="text-xs">None</p>
                  ) : (
                    <ul className="text-xs space-y-0.5">
                      {activity.recentContacts.map((c) => (
                        <li key={c.id} className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 shrink-0" />
                          {c.email} — {c.subject}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Assessments</p>
                  {activity.recentAssessments.length === 0 ? (
                    <p className="text-xs">None</p>
                  ) : (
                    <ul className="text-xs space-y-0.5">
                      {activity.recentAssessments.map((a) => (
                        <li key={a.id} className="flex items-center gap-1 truncate">
                          <FileCheck className="h-3 w-3 shrink-0" />
                          {a.email} — {a.status}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">CRM contacts</p>
                  {activity.recentCrmContacts.length === 0 ? (
                    <p className="text-xs">None</p>
                  ) : (
                    <ul className="text-xs space-y-0.5">
                      {activity.recentCrmContacts.map((c) => (
                        <li key={c.id} className="flex items-center gap-1 truncate">
                          <Contact className="h-3 w-3 shrink-0" />
                          {c.email} — {c.source}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Login & user activity log */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="h-4 w-4" />
                Login & user activity log
              </CardTitle>
              <CardDescription>
                User events: logins, failures, logout, and captured errors (persisted)
              </CardDescription>
            </div>
            <Select value={activityLogFilter || "all"} onValueChange={(v) => setActivityLogFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="login_success">Login success</SelectItem>
                <SelectItem value="login_failure">Login failure</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="error">Server error</SelectItem>
                <SelectItem value="client_error">Client / bug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingActivityLog ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activityLogEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No activity log entries yet. Logins, logouts, and errors will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-2 font-medium text-muted-foreground">Time</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground">Event</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground">User</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground">Success</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground max-w-[200px]">Message</th>
                    <th className="py-2 px-2 font-medium text-muted-foreground">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50">
                      <td className="py-2 px-2 whitespace-nowrap text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant={entry.eventType === "login_failure" || entry.eventType === "error" || entry.eventType === "client_error" ? "destructive" : "secondary"}>
                          {entry.eventType}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        {entry.username ?? entry.identifier ?? (entry.userId ? `#${entry.userId}` : "—")}
                      </td>
                      <td className="py-2 px-2">
                        {entry.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="py-2 px-2 max-w-[200px] truncate text-muted-foreground" title={entry.message ?? undefined}>
                        {entry.message ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground font-mono text-xs">
                        {entry.ipAddress ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No logs yet. Errors captured by API routes and client-side capture will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((entry) => (
            <Card
              key={entry.id}
              className={
                entry.type === "error"
                  ? "border-destructive/50 dark:border-destructive/50"
                  : ""
              }
            >
              <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.type === "error" ? (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Badge variant={entry.type === "error" ? "destructive" : "secondary"}>
                      {entry.type}
                    </Badge>
                    {entry.route && (
                      <Badge variant="outline">{entry.route}</Badge>
                    )}
                    {entry.method && (
                      <Badge variant="outline">{entry.method}</Badge>
                    )}
                    {entry.status != null && (
                      <Badge variant="outline">{entry.status}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                <CardTitle className="text-base font-medium mt-1">
                  {entry.message}
                </CardTitle>
                {(entry.route || entry.url) && (
                  <CardDescription className="text-xs">
                    {entry.route ?? entry.url}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {entry.fixHint && entry.fixHint.length > 0 && (
                  <div className="rounded-md bg-muted/60 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <FileCode className="h-4 w-4" />
                      Fix needed (file:line)
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {entry.fixHint.map((h, i) => (
                        <li key={i}>
                          {h.file}
                          {h.line != null && `:${h.line}`}
                          {h.column != null && `:${h.column}`}
                          {h.snippet && (
                            <span className="block text-xs mt-0.5 truncate max-w-full">
                              {h.snippet}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.stack && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 -ml-2 group">
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                        Stack trace
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="mt-2 p-3 rounded-md bg-muted text-xs overflow-x-auto whitespace-pre-wrap break-words">
                        {entry.stack}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
