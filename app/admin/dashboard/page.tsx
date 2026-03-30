"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  MessageSquare,
  FileCheck,
  CheckCircle,
  Clock,
  Archive,
  Receipt,
  Trash2,
  Send,
  Copy,
  ExternalLink,
  RotateCcw,
  Download,
  BookOpen,
  RefreshCw,
  Sparkles,
  KeyRound,
  Tag,
  Radar,
  ClipboardList,
  PenLine,
  Inbox,
  Map as MapIcon,
  LineChart,
  Search,
  ChevronDown,
  Calendar,
  CalendarClock,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatLocaleMediumDateTime } from "@/lib/localeDateTime";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  formatDevUpdateDateLabel,
  formatDevUpdateTimeInEastern,
  formatDevUpdatesLastChecked,
} from "@/lib/devUpdatesEastern";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminHelpTip } from "@/components/admin/AdminHelpTip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { AdminGuideTour } from "@/components/admin/AdminGuideTour";
import { AdminDailyNudge, buildNudgeItems } from "@/components/admin/AdminDailyNudge";
import { AdminOperatorIntelligenceCard } from "@/components/admin/AdminOperatorIntelligenceCard";
import { AdminRemindersCard } from "@/components/admin/AdminRemindersCard";
import {
  getTourCompleted,
  setTourCompleted,
  getTourDismissed,
  setTourDismissed,
  getStepsForRole,
} from "@/lib/adminTourConfig";
import { useMainDashboardLayout } from "@/hooks/useAdminUiLayouts";
import { AdminUnifiedLayoutSheetTrigger } from "@/components/admin/AdminUnifiedLayoutSheet";
import { CrmKpisWidget } from "@/components/admin/dashboard-widgets/CrmKpisWidget";
import { CrmSourcesTagsWidget } from "@/components/admin/dashboard-widgets/CrmSourcesTagsWidget";
import { CrmPipelineOverdueWidget } from "@/components/admin/dashboard-widgets/CrmPipelineOverdueWidget";
import { CrmTasksActivityWidget } from "@/components/admin/dashboard-widgets/CrmTasksActivityWidget";
import { AnalyticsSummaryCardsWidget } from "@/components/admin/dashboard-widgets/AnalyticsSummaryCardsWidget";
/** Summary row for list (lightweight for fast load on mobile). */
interface AssessmentSummary {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  projectName?: string;
  totalPrice: number;
}

/** Full assessment for View Details modal. */
interface Assessment {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  assessmentData: any;
  pricingBreakdown?: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string | null;
  company?: string | null;
  projectType?: string | null;
  budget?: string | null;
  timeframe?: string | null;
  newsletter?: boolean | null;
  pricingEstimate?: {
    estimatedRange: { min: number; max: number; average: number };
    marketComparison: { lowEnd: number; highEnd: number; average: number };
  } | null;
  createdAt: string;
}

/** Format assessment payload as plain text for display (no JSON). */
function formatAssessmentDataAsText(data: Record<string, unknown> | null | undefined): string {
  if (!data || typeof data !== "object") return "No data.";
  const lines: string[] = [];
  const label = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      lines.push(`${label(key)}: ${value.map((v) => (typeof v === "object" && v !== null ? String(v) : v)).join(", ")}`);
    } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
      lines.push(`${label(key)}: ${Object.entries(value).map(([k, v]) => `${k}: ${String(v)}`).join("; ")}`);
    } else {
      lines.push(`${label(key)}: ${String(value)}`);
    }
  };
  const order = ["projectName", "projectType", "projectDescription", "targetAudience", "mainGoals", "successMetrics", "platform", "mustHaveFeatures", "niceToHaveFeatures", "preferredTimeline", "budget", "newsletter"];
  order.forEach((key) => append(key, (data as Record<string, unknown>)[key]));
  Object.keys(data).filter((k) => !order.includes(k)).forEach((key) => append(key, (data as Record<string, unknown>)[key]));
  return lines.filter(Boolean).join("\n");
}

/** Format pricing breakdown as plain text for display (no JSON). */
function formatPricingAsText(pb: Record<string, unknown> | null | undefined): string {
  if (!pb || typeof pb !== "object") return "No pricing data.";
  const lines: string[] = [];
  const range = pb.estimatedRange as { min?: number; max?: number; average?: number } | undefined;
  if (range) {
    if (range.min != null && range.max != null) {
      lines.push(`Estimated range: $${Number(range.min).toLocaleString()} – $${Number(range.max).toLocaleString()}`);
    }
    if (range.average != null) lines.push(`Average: $${Number(range.average).toLocaleString()}`);
  }
  if (pb.basePrice != null) lines.push(`Base price: $${Number(pb.basePrice).toLocaleString()}`);
  const features = pb.features as Array<{ name?: string; price?: number }> | undefined;
  if (Array.isArray(features) && features.length) {
    lines.push("");
    lines.push("Features:");
    features.forEach((f) => {
      const name = f.name ?? "Item";
      const price = f.price != null ? `$${Number(f.price).toLocaleString()}` : "";
      lines.push(`  • ${name}${price ? ` — ${price}` : ""}`);
    });
  }
  return lines.join("\n");
}

const DASHBOARD_INBOX_TABS = ["assessments", "contacts"] as const;
type DashboardInboxTab = (typeof DASHBOARD_INBOX_TABS)[number];

function parseDashboardInboxTab(raw: string | null): DashboardInboxTab {
  if (raw === "contacts" || raw === "assessments") return raw;
  return "assessments";
}

type DevDigestEntry = {
  date: string;
  time?: string;
  title: string;
  items: string[];
  sourceBranches?: string[];
};

type ShortcutCategory = "core" | "growth" | "ops" | "content";

type WorkspaceShortcut = {
  href: string;
  label: string;
  icon?: LucideIcon;
  help: string;
  category: ShortcutCategory;
};

const MOBILE_SHORTCUTS_INITIAL_COUNT = 6;

const SHORTCUT_CATEGORY_META: {
  id: ShortcutCategory | "all";
  label: string;
  shortLabel: string;
}[] = [
  { id: "all", label: "All shortcuts", shortLabel: "All" },
  { id: "core", label: "Core admin", shortLabel: "Core" },
  { id: "growth", label: "Growth systems", shortLabel: "Growth" },
  { id: "ops", label: "Ops", shortLabel: "Ops" },
  { id: "content", label: "Content", shortLabel: "Content" },
];

const WORKSPACE_SHORTCUTS: WorkspaceShortcut[] = [
  {
    href: "/admin/scheduler",
    label: "Meetings & calendar",
    icon: Calendar,
    category: "core",
    help: "Calendar, appointment inbox, and branded booking links. Start here for day-to-day booking work.",
  },
  {
    href: "/admin/scheduling",
    label: "Booking & reminders setup",
    icon: CalendarClock,
    category: "core",
    help: "Time zone, meeting types, availability, emails, and whether public booking is on.",
  },
  {
    href: "/admin/site-directory",
    label: "Pages directory",
    icon: MapIcon,
    category: "core",
    help: "On the directory screen: search and filter every route, open a page, or copy full JSON for tools. Tip: narrow by audience when you only want admin tools.",
  },
  {
    href: "/admin/how-to",
    label: "How-to & guides",
    icon: BookOpen,
    category: "core",
    help: "Curated step-by-step articles (LTV, discovery, intelligence, knowledge base). Read a section, then work in the target tool using its own ? tips on each field.",
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    icon: Receipt,
    category: "ops",
    help: "Build invoices, line items, and tax; send for payment when Stripe is connected. Check statuses as clients pay.",
  },
  {
    href: "/admin/announcements",
    label: "Project updates",
    category: "ops",
    help: "Write admin-facing project news that shows in digest and related surfaces. Use for shipped work and operating notes.",
  },
  {
    href: "/admin/feedback",
    label: "Feedback",
    category: "ops",
    help: "Review submissions from site feedback flows; triage and archive so nothing important sits unread.",
  },
  {
    href: "/admin/offers",
    label: "Site offers",
    icon: Tag,
    category: "ops",
    help: "Edit offer copy, URLs, and funnel wiring for public lead magnets and sales pages tied to this site.",
  },
  {
    href: "/admin/growth-platform",
    label: "Growth platform",
    icon: Layers,
    category: "growth",
    help: "DFY/DWY/DIY offer stack catalog and PPC model summaries; links to the public hub and related admin tools.",
  },
  {
    href: "/admin/growth-platform/agreements",
    label: "Document signing",
    icon: FileCheck,
    category: "growth",
    help: "Service agreement workflow: generate agreement pages, send DocuSign envelopes, export PDFs, and manage e-sign milestones.",
  },
  {
    href: "/admin/challenge/leads",
    label: "Challenge leads",
    category: "growth",
    help: "Leads captured from challenge funnels; use filters and exports there to move people into CRM follow-up.",
  },
  {
    href: "/admin/growth-os",
    label: "Growth OS",
    icon: Radar,
    category: "growth",
    help: "Configure the Growth OS product: security, client shares, revenue settings. Explore sub-pages from there; each has its own forms and ? help.",
  },
  {
    href: "/admin/growth-os/intelligence",
    label: "Market research",
    icon: Search,
    category: "growth",
    help: "Run keyword/topic batches, read performance rollups, and wire automations—creative ops research, not the scored AMIE economics model.",
  },
  {
    href: "/admin/market-intelligence",
    label: "AMIE intelligence",
    icon: Radar,
    category: "growth",
    help: "Fill market inputs, run analysis, read scores and opportunity tier, then copy JSON or save a research row. ? icons on that page decode each card and field.",
  },
  {
    href: "/admin/internal-audit",
    label: "Funnel audit",
    icon: ClipboardList,
    category: "growth",
    help: "Internal checklist and scoring for funnel assets before launch. Work the items on that screen to clear readiness gaps.",
  },
  {
    href: "/offer-valuation",
    label: "Offer valuation",
    icon: LineChart,
    category: "growth",
    help: "Monitor the public offer-valuation funnel: submissions, status, and follow-up from the admin side of that flow.",
  },
  {
    href: "/admin/content-studio",
    label: "Content studio",
    icon: PenLine,
    category: "content",
    help: "Draft documents, manage the editorial calendar, and schedule social posts from one hub. Each sub-view explains approvals and publishing on that page.",
  },
  {
    href: "/admin/agent-knowledge",
    label: "Assistant knowledge",
    icon: BookOpen,
    category: "core",
    help: "Create entries and toggle where they’re allowed (assistant, research, messages). The floating mentor reads enabled text as trusted context—edit titles and bodies on that screen.",
  },
];

/** One release note block — full text always visible; the whole feed is collapsed via a parent Collapsible. */
function DevUpdateDigestEntry({ entry, index }: { entry: DevDigestEntry; index: number }) {
  const headingId = `dev-update-heading-${index}`;
  const dateLabel = formatDevUpdateDateLabel(entry.date);
  const timeInfo = entry.time ? formatDevUpdateTimeInEastern(entry.date, entry.time) : null;
  const dateTimeAttr = timeInfo?.instant ? timeInfo.instant.toISOString() : entry.date;
  const hasItems = entry.items && entry.items.length > 0;
  const hasBranchNote = entry.sourceBranches && entry.sourceBranches.length > 1;

  return (
    <article className="border-b border-border/70 pb-6 last:border-b-0 last:pb-0 scroll-mt-2" aria-labelledby={headingId}>
      <header className="mb-3 space-y-1 max-w-3xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm shrink-0">
            <time
              className="font-medium tabular-nums text-foreground"
              dateTime={dateTimeAttr}
              suppressHydrationWarning
            >
              {dateLabel}
            </time>
            {timeInfo ? (
              <>
                <span className="text-muted-foreground" aria-hidden>
                  ·
                </span>
                <span className="tabular-nums text-muted-foreground font-medium" suppressHydrationWarning>
                  {timeInfo.label}
                </span>
              </>
            ) : null}
          </div>
          <h3 id={headingId} className="text-base font-semibold text-foreground leading-snug tracking-tight min-w-0 flex-1">
            {entry.title}
          </h3>
        </div>
        {!hasItems && !hasBranchNote ? (
          <p className="text-sm text-muted-foreground">No detail bullets for this entry.</p>
        ) : null}
      </header>
      {hasBranchNote ? (
        <p className="text-sm text-muted-foreground mb-3 max-w-3xl leading-relaxed">
          Also on branches: {entry.sourceBranches!.join(", ")}
        </p>
      ) : null}
      {hasItems ? (
        <ul className="space-y-3 list-none pl-0 m-0 max-w-3xl text-sm leading-relaxed text-foreground">
          {entry.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-primary shrink-0 mt-0.5 select-none" aria-hidden>
                •
              </span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteAssessmentId, setDeleteAssessmentId] = useState<number | null>(null);
  const [createProposalResult, setCreateProposalResult] = useState<{ viewUrl: string; quoteNumber: string } | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showTourBanner, setShowTourBanner] = useState(false);
  const [tourCompletedOrDismissed, setTourCompletedOrDismissed] = useState(false);
  const [passwordResetEmail, setPasswordResetEmail] = useState("");
  /** Entire development-updates feed (metadata + entries) — not per-row. */
  const [devUpdatesOpen, setDevUpdatesOpen] = useState(false);
  const [shortcutCategory, setShortcutCategory] = useState<ShortcutCategory | "all">("all");
  const [showAllShortcutsMobile, setShowAllShortcutsMobile] = useState(false);
  const [inboxTab, setInboxTab] = useState<DashboardInboxTab>("assessments");
  const inboxTabsRef = useRef<HTMLDivElement>(null);
  const handled403 = useRef(false);
  /** Avoid hydration mismatch: server vs client can disagree on auth (e.g. sessionStorage placeholderData). */
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => {
    setClientReady(true);
  }, []);

  const dashboardLayout = useMainDashboardLayout();

  const filteredShortcuts = useMemo(
    () =>
      shortcutCategory === "all"
        ? WORKSPACE_SHORTCUTS
        : WORKSPACE_SHORTCUTS.filter((s) => s.category === shortcutCategory),
    [shortcutCategory],
  );

  const mobileShortcutItems = useMemo(
    () =>
      showAllShortcutsMobile
        ? filteredShortcuts
        : filteredShortcuts.slice(0, MOBILE_SHORTCUTS_INITIAL_COUNT),
    [filteredShortcuts, showAllShortcutsMobile],
  );

  useEffect(() => {
    setShowAllShortcutsMobile(false);
  }, [shortcutCategory]);

  const sendPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/admin/users/send-password-reset", { email: email.trim() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? "Failed to send");
      }
      return res.json();
    },
    onSuccess: (_, email) => {
      toast({
        title: "Reset email sent",
        descriptionKey: "admin.resetEmailDescription",
        values: { email },
      });
      setPasswordResetEmail("");
    },
    onError: (e: Error) => toast({ title: "Could not send reset email", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const completed = getTourCompleted();
    const dismissed = getTourDismissed();
    setShowTourBanner(!completed && !dismissed);
    setTourCompletedOrDismissed(completed || dismissed);
  }, []);

  const handleAdmin403 = (errorMessage?: string) => {
    if (handled403.current) return;
    handled403.current = true;
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    let hint = "Session may have expired. Please sign in again.";
    try {
      const parsed = typeof errorMessage === "string" && errorMessage.startsWith("{") ? JSON.parse(errorMessage) : null;
      if (parsed?.hint) hint = parsed.hint;
    } catch {
      if (errorMessage?.includes("create-session-table")) hint = "Run in terminal: npx tsx scripts/create-session-table.ts then log out and log back in.";
    }
    toast({
      title: "Access denied",
      description: hint,
      variant: "destructive",
      duration: 12000,
    });
    router.push("/auth");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setInboxTab(parseDashboardInboxTab(searchParams.get("tab")));
  }, [searchParams]);

  const onInboxTabChange = useCallback(
    (value: string) => {
      const next = parseDashboardInboxTab(value);
      setInboxTab(next);
      router.replace(`/admin/dashboard?tab=${next}`, { scroll: false });
      requestAnimationFrame(() =>
        inboxTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    },
    [router],
  );

  // Fetch assessments (summary only for fast mobile load)
  const { data: assessments = [], isLoading: assessmentsLoading, error: assessmentsError } = useQuery<AssessmentSummary[]>({
    queryKey: ["/api/admin/assessments", { summary: 1 }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assessments?summary=1");
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    retry: (failureCount, error: Error) => {
      const msg = String(error?.message ?? "");
      if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Admin access required")) return false;
      return failureCount < 1;
    },
  });

  // Fetch deleted assessments for recovery
  const { data: deletedAssessments = [], isLoading: deletedLoading } = useQuery<AssessmentSummary[]>({
    queryKey: ["/api/admin/assessments", { summary: 1, deleted: 1 }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assessments?summary=1&deleted=1");
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  // Invalidate only list queries (not single-assessment detail) to avoid refetching a 404 detail and spamming the API
  const invalidateAssessmentLists = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const k = query.queryKey;
        return k[0] === "/api/admin/assessments" && typeof k[1] === "object" && k[1] !== null && "summary" in (k[1] as object);
      },
    });
  }, [queryClient]);

  // Fetch full assessment only when View Details is opened (no refetch on focus to avoid repeated 404s for deleted items)
  // Use fetch directly so we never show raw HTML in the UI when production returns an HTML error page
  const { data: selectedAssessment, isLoading: selectedAssessmentLoading, error: selectedAssessmentError } = useQuery<Assessment>({
    queryKey: ["/api/admin/assessments", selectedAssessmentId],
    queryFn: async () => {
      if (selectedAssessmentId == null) throw new Error("No id");
      const storageKey = `admin_assessment_404_${selectedAssessmentId}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey) === "1") {
        throw new Error("Assessment not found.");
      }
      const response = await fetch(`/api/admin/assessments/${selectedAssessmentId}`, { credentials: "include" });
      const text = await response.text();
      let data: { error?: string } = {};
      try {
        if (text.trim().startsWith("{")) data = JSON.parse(text);
      } catch {
        // Server may return HTML 404/500 page in production
      }
      if (!response.ok) {
        if (response.status === 404 && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
        }
        const safeMessage =
          (typeof data?.error === "string" && data.error.trim().length > 0 && data.error.length < 500)
            ? data.error.trim()
            : response.status === 404
              ? "Assessment not found."
              : "Failed to load assessment. Try again or check the server.";
        throw new Error(safeMessage);
      }
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(storageKey);
      if (data && typeof (data as Assessment).id === "number" && typeof (data as Assessment).email === "string") {
        return data as Assessment;
      }
      throw new Error("Invalid response from server.");
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && selectedAssessmentId != null,
    retry: (failureCount, error) => {
      if (error?.message?.includes("Assessment not found") || error?.message?.includes("404")) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // When detail returns 404, refresh the list only (not the detail query) so stale entries disappear when user closes the dialog
  useEffect(() => {
    if (!selectedAssessmentError || !selectedAssessmentId) return;
    const msg = String(selectedAssessmentError.message ?? "");
    if (!msg.includes("Assessment not found") && !msg.includes("404") && !msg.includes("not found")) return;
    invalidateAssessmentLists();
  }, [selectedAssessmentError, selectedAssessmentId, invalidateAssessmentLists]);

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading, error: contactsError } = useQuery<Contact[]>({
    queryKey: ["/api/admin/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/contacts");
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    retry: (failureCount, error: Error) => {
      const msg = String(error?.message ?? "");
      if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Admin access required")) return false;
      return failureCount < 1;
    },
  });

  const { data: operatorProfileData } = useQuery<{ profile: { roleSelection: string } }>({
    queryKey: ["/api/admin/operator-profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/operator-profile");
      if (!res.ok) throw new Error("Failed to load operator profile");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    staleTime: 60_000,
  });

  // Development updates log (digest; auto-refresh when new features ship)
  const { data: devUpdatesData, isLoading: devUpdatesLoading, refetch: refetchDevUpdates, dataUpdatedAt: devUpdatesCheckedAt } = useQuery<{
    updates: { date: string; time?: string; title: string; items: string[]; sourceBranches?: string[] }[];
    source?: "file" | "github";
    sourceNote?: string;
    mergeInfo?: { branchesScanned: number; branchesWithFile: number; mode: "multi_branch" | "single_branch" };
  }>({
    queryKey: ["/api/admin/development-updates"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/development-updates");
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Handle 403 from any admin query (onError was removed in TanStack Query v5)
  useEffect(() => {
    const err = assessmentsError ?? contactsError;
    if (!err) return;
    const msg = String(err?.message ?? "");
    if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Admin access required")) {
      handleAdmin403(msg);
    }
  }, [assessmentsError, contactsError]);

  // Update assessment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("POST", `/api/admin/assessments/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      invalidateAssessmentLists();
      toast({
        title: "Success",
        description: "Assessment status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Delete assessment mutation (soft delete: moves to Deleted, recoverable)
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/assessments/${id}`);
    },
    onSuccess: () => {
      invalidateAssessmentLists();
      setDeleteAssessmentId(null);
      toast({ title: "Assessment moved to Deleted", description: "You can restore it from the Deleted section below." });
    },
    onError: (error: any) => {
      setDeleteAssessmentId(null);
      toast({
        title: "Cannot delete",
        description: error?.message || "Failed to delete assessment",
        variant: "destructive",
      });
    },
  });

  // Restore soft-deleted assessment
  const restoreAssessmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/assessments/${id}/restore`);
      return await response.json();
    },
    onSuccess: () => {
      invalidateAssessmentLists();
      toast({ title: "Assessment restored", description: "It appears in the active list again." });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot restore",
        description: error?.message || "Failed to restore assessment",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      reviewed: "secondary",
      contacted: "default",
      archived: "secondary",
    };
    
    const icons: Record<string, any> = {
      pending: Clock,
      reviewed: CheckCircle,
      contacted: CheckCircle,
      archived: Archive,
    };
    
    const Icon = icons[status] || Clock;
    
    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  if (!clientReady || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" aria-busy="true" aria-label="Loading dashboard">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  const pendingAssessments = assessments.filter((a) => a.status === "pending").length;
  const activeAssessments = assessments.filter((a) => a.status !== "archived");
  const archivedAssessments = assessments.filter((a) => a.status === "archived");
  const isSuperAdmin = isAuthSuperUser(user);
  const tourSteps = getStepsForRole(isSuperAdmin);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const createdInLastWeek = (iso: string) => {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) && t >= sevenDaysAgo;
  };
  const recentContactsWeek = contacts.filter((c) => createdInLastWeek(c.createdAt)).length;
  const recentInboundWeekCount =
    recentContactsWeek + assessments.filter((a) => createdInLastWeek(a.createdAt)).length;
  const nudgeItems = buildNudgeItems({
    pendingAssessments,
    totalContacts: contacts.length,
    isSuperAdmin,
    operatorRoleFocus: operatorProfileData?.profile?.roleSelection,
    recentInboundWeekCount,
    recentContactsWeek,
  });

  const sectionShell = (id: string, render: () => React.ReactNode) => {
    const idx = dashboardLayout.visibleSectionOrder.indexOf(id);
    if (idx < 0) return null;
    return (
      <div id={`admin-widget-${id}`} className="w-full min-w-0" style={{ order: idx }}>
        {render()}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full min-w-0 max-w-7xl mx-auto px-3 fold:px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Tune what appears and in what order with Customize—defaults favor inbound work first, then tools and
            notes.
          </p>
        </div>
        {dashboardLayout.ready ? <AdminUnifiedLayoutSheetTrigger initialSurface="main" /> : null}
      </div>

      {/* New admin: offer guided tour */}
      {showTourBanner && !tourActive && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="py-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">New to the admin?</p>
                <p className="text-xs text-muted-foreground">Take a short tour to see features and daily actions.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 sm:ml-4">
              <Button size="sm" onClick={() => setTourActive(true)}>
                Start tour
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTourDismissed();
                  setShowTourBanner(false);
                }}
              >
                Maybe later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guided tour overlay (not part of reorderable blocks) */}
      {tourActive && tourSteps.length > 0 && (
        <AdminGuideTour
          steps={tourSteps}
          currentStep={tourStep}
          onNext={() => setTourStep((s) => (s >= tourSteps.length - 1 ? s : s + 1))}
          onBack={() => setTourStep((s) => (s <= 0 ? 0 : s - 1))}
          onEnd={() => {
            setTourCompleted();
            setTourActive(false);
            setTourStep(0);
          }}
          onDismiss={() => {
            setTourDismissed();
            setTourActive(false);
            setTourStep(0);
          }}
        />
      )}

      {dashboardLayout.visibleSectionOrder.length === 0 ? (
        <Card className="mb-6 border-dashed border-amber-500/40 bg-amber-500/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">No dashboard sections visible</CardTitle>
            <CardDescription>
              Open <span className="font-medium text-foreground">Customize pages</span> above and turn on at least one
              module, or reset to the default layout.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="flex flex-col w-full min-w-0">
        {sectionShell(
          "suggested",
          () => (
            <div className="mb-4">
              <AdminDailyNudge
                items={nudgeItems}
                onStartTour={() => setTourActive(true)}
                showTourCta={tourCompletedOrDismissed}
              />
            </div>
          ),
        )}
        {sectionShell(
          "reminders",
          () => (
            <div className="mb-4">
              <AdminRemindersCard compact maxItems={5} showGenerate />
            </div>
          ),
        )}

      {/* Summary Cards */}
      {sectionShell(
        "summary",
        () => (
        <div data-tour="summary-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <FileCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingAssessments} pending review
            </p>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium">Quotes/Contacts</CardTitle>
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contact form submissions
            </p>
          </CardContent>
        </Card>

      </div>
        ),
      )}

      {sectionShell(
        "inbox",
        () => (
        <section className="mb-6 sm:mb-8 space-y-2" aria-labelledby="admin-dashboard-inbox-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="admin-dashboard-inbox-heading" className="text-base font-semibold text-foreground tracking-tight">
            Inbox
          </h2>
          <p className="text-xs text-muted-foreground max-w-md text-right leading-snug">
            Triage new assessments and contact form messages here before diving into other tools.
          </p>
        </div>
        {/* Tabs — sync with ?tab=assessments|contacts (e.g. from Suggested for you) */}
        <div ref={inboxTabsRef} id="admin-dashboard-inbox-tabs" className="scroll-mt-20">
          <Tabs value={inboxTab} onValueChange={onInboxTabChange} className="space-y-4" data-tour="tabs">
            <TabsList className="w-full sm:w-auto flex flex-nowrap h-auto min-h-[44px] overflow-x-auto overflow-y-hidden gap-1 p-1.5 bg-muted/80 rounded-lg [&>button]:shrink-0 [&>button]:text-xs sm:[&>button]:text-sm [&>button]:px-3 [&>button]:py-2">
          <TabsTrigger value="assessments">
            Assessments ({assessments.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({contacts.length})
          </TabsTrigger>
        </TabsList>
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
          <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <Link href="/admin/lead-intake" className="text-primary font-medium hover:underline">
            Lead intake hub
          </Link>
          <span>— unified diagnosis, funnel quiz, and assessments with CRM import (optional AI).</span>
        </p>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-6 mt-4">
          {assessmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : assessments.length === 0 ? (
            <Card className="overflow-hidden">
              <CardContent className="py-12 px-4 sm:px-6 text-center">
                <p className="text-sm text-muted-foreground">No assessments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Active assessments (pending, reviewed, contacted) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Active ({activeAssessments.length})
                </h3>
                {activeAssessments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active assessments. Change status from Archived to move back.</p>
                ) : (
                  activeAssessments.map((assessment) => (
                    <Card key={assessment.id} className="overflow-hidden">
                      <CardHeader className="px-4 sm:px-6 pb-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg truncate">{assessment.name}</CardTitle>
                            <CardDescription className="break-all">
                              {assessment.email} {assessment.phone && `• ${assessment.phone}`}
                            </CardDescription>
                            {assessment.company && (
                              <CardDescription className="truncate">{assessment.company}</CardDescription>
                            )}
                          </div>
                          <div className="shrink-0">{getStatusBadge(assessment.status)}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-6 pt-0 space-y-3">
                        <div>
                          <p className="text-sm font-medium">Project</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {assessment.projectName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Estimated Price</p>
                          <p className="text-sm font-semibold">{formatCurrency(assessment.totalPrice)}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          <Select
                            value={assessment.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ id: assessment.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => setSelectedAssessmentId(assessment.id)}>
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/assessment/results?id=${assessment.id}`)}>
                              View Results
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteAssessmentId(assessment.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          Submitted: {formatLocaleMediumDateTime(assessment.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Archived folder */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived ({archivedAssessments.length})
                </h3>
                {archivedAssessments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No archived assessments. Set status to &quot;Archived&quot; to move here.</p>
                ) : (
                  archivedAssessments.map((assessment) => (
                    <Card key={assessment.id} className="overflow-hidden border-muted">
                      <CardHeader className="px-4 sm:px-6 pb-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg truncate">{assessment.name}</CardTitle>
                            <CardDescription className="break-all">
                              {assessment.email} {assessment.phone && `• ${assessment.phone}`}
                            </CardDescription>
                            {assessment.company && (
                              <CardDescription className="truncate">{assessment.company}</CardDescription>
                            )}
                          </div>
                          <div className="shrink-0">{getStatusBadge(assessment.status)}</div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-6 pt-0 space-y-3">
                        <div>
                          <p className="text-sm font-medium">Project</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {assessment.projectName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Estimated Price</p>
                          <p className="text-sm font-semibold">{formatCurrency(assessment.totalPrice)}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          <Select
                            value={assessment.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ id: assessment.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewed">Reviewed</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => setSelectedAssessmentId(assessment.id)}>
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/assessment/results?id=${assessment.id}`)}>
                              View Results
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteAssessmentId(assessment.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          Submitted: {formatLocaleMediumDateTime(assessment.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Deleted (recoverable) */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    Deleted ({deletedAssessments.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await apiRequest("GET", "/api/admin/assessments/export?includeDeleted=1");
                        const blob = await res.blob();
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `assessments-backup-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                        toast({ title: "Backup downloaded", description: "Saved assessments (including deleted) as JSON." });
                      } catch (e) {
                        toast({ title: "Export failed", description: (e as Error)?.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export backup (JSON)
                  </Button>
                </div>
                {deletedLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : deletedAssessments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deleted assessments. Removed items appear here and can be restored.</p>
                ) : (
                  deletedAssessments.map((assessment) => (
                    <Card key={assessment.id} className="overflow-hidden border-dashed border-muted-foreground/30 bg-muted/30">
                      <CardContent className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{assessment.name}</p>
                          <p className="text-sm text-muted-foreground break-all">{assessment.email}</p>
                          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                            Removed {assessment.deletedAt ? formatLocaleMediumDateTime(assessment.deletedAt) : "—"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreAssessmentMutation.mutate(assessment.id)}
                          disabled={restoreAssessmentMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {restoreAssessmentMutation.isPending && restoreAssessmentMutation.variables === assessment.id ? "Restoring…" : "Restore"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4 mt-4">
          {contactsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <Card className="overflow-hidden">
              <CardContent className="py-12 px-4 sm:px-6 text-center">
                <p className="text-sm text-muted-foreground">No contacts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const isQuote = Boolean(
                  contact.projectType || contact.budget || contact.timeframe
                );
                return (
                  <Card key={contact.id} className="overflow-hidden">
                    <CardHeader className="px-4 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            {contact.name}
                          </CardTitle>
                          <CardDescription className="break-all">
                            {contact.email}
                          </CardDescription>
                        </div>
                        {isQuote && (
                          <Badge variant="secondary" className="shrink-0">
                            Quote Request
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pt-0 space-y-3">
                      <div>
                        <p className="text-sm font-medium">Subject</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.subject ||
                            (isQuote ? "Quote Request" : "Contact Submission")}
                        </p>
                      </div>
                      {isQuote && (
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          {contact.projectType && (
                            <div>
                              <span className="font-medium text-foreground">
                                Project Type:
                              </span>{" "}
                              {contact.projectType}
                            </div>
                          )}
                          {contact.budget && (
                            <div>
                              <span className="font-medium text-foreground">
                                Budget:
                              </span>{" "}
                              {contact.budget}
                            </div>
                          )}
                          {contact.timeframe && (
                            <div>
                              <span className="font-medium text-foreground">
                                Timeline:
                              </span>{" "}
                              {contact.timeframe}
                            </div>
                          )}
                          {contact.phone && (
                            <div>
                              <span className="font-medium text-foreground">
                                Phone:
                              </span>{" "}
                              {contact.phone}
                            </div>
                          )}
                          {contact.company && (
                            <div>
                              <span className="font-medium text-foreground">
                                Company:
                              </span>{" "}
                              {contact.company}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">Message</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {contact.message}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedContact(contact)}
                      >
                        View Full Message
                      </Button>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        Submitted:{" "}
                        {contact.createdAt
                          ? formatLocaleMediumDateTime(contact.createdAt)
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
          </Tabs>
        </div>

      </section>
        ),
      )}

      {sectionShell(
        "intelligence",
        () => (
        <div className="mb-6 sm:mb-8">
          <AdminOperatorIntelligenceCard />
        </div>
        ),
      )}

      {sectionShell(
        "shortcuts",
        () => (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-foreground">Workspace shortcuts</span>
        <AdminHelpTip
          content="Open deeper tools (billing, intel, content, directory) after inbox triage. On each destination page, use ? next to headings and fields—that’s where controls are explained, not the top nav."
          ariaLabel="Help: Workspace shortcuts row"
        />
      </div>
      <div data-tour="quick-links" className="mb-6 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SHORTCUT_CATEGORY_META.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              variant={shortcutCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 min-h-[40px] px-3"
              onClick={() => {
                setShortcutCategory(cat.id);
                setShowAllShortcutsMobile(false);
              }}
            >
              {cat.shortLabel}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
          {mobileShortcutItems.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={shortcut.href}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-card/80 p-2.5"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto min-h-[44px] flex-1 justify-start px-0 text-left"
                  asChild
                >
                  <Link href={shortcut.href} className="flex w-full items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
                    <span className="truncate text-sm">{shortcut.label}</span>
                  </Link>
                </Button>
                <AdminHelpTip
                  content={shortcut.help}
                  ariaLabel={`Help: ${shortcut.label}`}
                />
              </div>
            );
          })}
        </div>
        {filteredShortcuts.length > MOBILE_SHORTCUTS_INITIAL_COUNT && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full min-h-[44px]"
            onClick={() => setShowAllShortcutsMobile((v) => !v)}
          >
            {showAllShortcutsMobile ? "Show fewer shortcuts" : `Show all shortcuts (${filteredShortcuts.length})`}
          </Button>
        )}
      </div>
        </>
        ),
      )}

      {sectionShell(
        "password",
        () => (
        <>
      {/* Password reset control — send reset link to any user by email */}
      <Card className="mb-6 border bg-card shadow-sm overflow-hidden">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            Password reset
          </CardTitle>
          <CardDescription>
            Send a password reset link to any user or subscriber by email. They will receive a link valid for 1 hour.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px] max-w-sm space-y-1">
              <Label htmlFor="password-reset-email" className="text-sm">Email address</Label>
              <Input
                id="password-reset-email"
                type="email"
                placeholder="user@example.com"
                value={passwordResetEmail}
                onChange={(e) => setPasswordResetEmail(e.target.value)}
                disabled={sendPasswordResetMutation.isPending}
                className="max-w-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={() => sendPasswordResetMutation.mutate(passwordResetEmail)}
              disabled={!passwordResetEmail.trim() || sendPasswordResetMutation.isPending}
            >
              {sendPasswordResetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send reset email
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Users can also request a reset from the sign-in page via &quot;Forgot password?&quot; — same link, same expiry.
          </p>
        </CardContent>
      </Card>
        </>
        ),
      )}

      {sectionShell(
        "devUpdates",
        () => (
        <>
      {/* Development updates log — single collapsible for the whole feed; entries are always fully readable when open */}
      <Card data-tour="development-updates" className="mb-6 sm:mb-8 border bg-card shadow-sm overflow-hidden">
        <Collapsible open={devUpdatesOpen} onOpenChange={setDevUpdatesOpen}>
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left -m-1 p-1",
                    "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  aria-expanded={devUpdatesOpen}
                >
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground mt-0.5 transition-transform duration-200",
                      devUpdatesOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base sm:text-lg flex flex-wrap items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      Development updates
                      {devUpdatesData?.updates?.length ? (
                        <Badge variant="secondary" className="font-normal text-xs">
                          {devUpdatesData.updates.length}
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {devUpdatesOpen ? "Click to hide the full log" : "Click to show release notes and source details"}
                    </p>
                  </div>
                </button>
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  void refetchDevUpdates();
                }}
                disabled={devUpdatesLoading}
              >
                {devUpdatesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent className="data-[state=closed]:animate-none">
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <CardDescription className="text-sm leading-relaxed max-w-3xl mb-4">
                {isSuperAdmin ?
                  <>
                    Features and fixes shipped to production. In production, the list loads from{" "}
                    <code className="text-xs bg-muted px-1 rounded break-all">content/development-updates.md</code> on
                    GitHub <code className="text-xs bg-muted px-1 rounded">main</code> by default (
                    <code className="text-xs bg-muted px-1 rounded break-all">DEVELOPMENT_UPDATES_GITHUB_REF</code>). On
                    Vercel, the raw URL is built from{" "}
                    <code className="text-xs bg-muted px-1 rounded break-all">VERCEL_GIT_REPO_OWNER</code> /{" "}
                    <code className="text-xs bg-muted px-1 rounded break-all">VERCEL_GIT_REPO_SLUG</code> unless you set{" "}
                    <code className="text-xs bg-muted px-1 rounded break-all">DEVELOPMENT_UPDATES_RAW_URL</code>. Edit the
                    markdown on <code className="text-xs bg-muted px-1 rounded">main</code> and push; this panel refreshes
                    automatically.
                  </>
                : "Highlights of what shipped to production. The list updates from your team’s release notes on GitHub."}
              </CardDescription>
              {(devUpdatesData || devUpdatesCheckedAt) && (
                <div className="space-y-2 mb-5 pb-4 border-b border-border/60 max-w-3xl">
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground leading-relaxed">
                    {devUpdatesCheckedAt > 0 && (
                      <span suppressHydrationWarning>
                        Last checked: {formatDevUpdatesLastChecked(devUpdatesCheckedAt)} (US Eastern)
                      </span>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {devUpdatesData?.source && (
                        <span>
                          Source:{" "}
                          {devUpdatesData.source === "github"
                            ? devUpdatesData.mergeInfo?.mode === "multi_branch"
                              ? "GitHub (live, merged branches)"
                              : "GitHub (live)"
                            : "file"}
                        </span>
                      )}
                      {devUpdatesData?.source === "github" && devUpdatesData.mergeInfo?.mode === "multi_branch" && (
                        <span>
                          · {devUpdatesData.mergeInfo.branchesWithFile}/{devUpdatesData.mergeInfo.branchesScanned}{" "}
                          branches had the file
                        </span>
                      )}
                      {devUpdatesData?.source === "github" && <span>New pushes may take up to ~5 min to appear.</span>}
                    </div>
                    <span className="text-muted-foreground/90">
                      Entry dates and headline times use US Eastern (America/New_York).
                    </span>
                  </div>
                  {devUpdatesData?.sourceNote && (
                    <p className="text-sm leading-relaxed text-amber-600 dark:text-amber-500">{devUpdatesData.sourceNote}</p>
                  )}
                </div>
              )}
              {devUpdatesLoading && !devUpdatesData ? (
                <div className="flex items-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span className="text-sm">Loading updates…</span>
                </div>
              ) : !devUpdatesData?.updates?.length ? (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl py-2">
                  {isSuperAdmin ?
                    <>
                      No entries yet. Add sections to content/development-updates.md: start each section with{" "}
                      <code className="text-xs bg-muted px-1 rounded break-all">## YYYY-MM-DD — Title</code> or include
                      time like{" "}
                      <code className="text-xs bg-muted px-1 rounded break-all">## YYYY-MM-DD 14:30 — Title</code>, then
                      bullet points. Push to production to see them here.
                    </>
                  : "No release notes in the feed yet. Ask your technical lead to publish updates to the development-updates log."}
                </p>
              ) : (
                <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-4 sm:px-4 sm:py-5">
                  {devUpdatesData.updates.map((entry, idx) => (
                    <DevUpdateDigestEntry key={`${entry.date}-${entry.title}-${idx}`} entry={entry} index={idx} />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
        </>
        ),
      )}

        {sectionShell("kpis", () => (
          <div className="mb-4 min-w-0">
            <CrmKpisWidget />
          </div>
        ))}
        {sectionShell("sourcesTags", () => (
          <div className="mb-4 min-w-0">
            <CrmSourcesTagsWidget />
          </div>
        ))}
        {sectionShell("pipeline", () => (
          <div className="mb-4 min-w-0">
            <CrmPipelineOverdueWidget />
          </div>
        ))}
        {sectionShell("tasksActivity", () => (
          <div className="mb-4 min-w-0">
            <CrmTasksActivityWidget />
          </div>
        ))}
        {sectionShell("analytics_summary", () => (
          <div className="mb-4 min-w-0">
            <AnalyticsSummaryCardsWidget />
          </div>
        ))}
      </div>

            {/* Delete assessment confirmation (soft delete: recoverable from Deleted section) */}
      <AlertDialog open={deleteAssessmentId !== null} onOpenChange={(open) => !open && setDeleteAssessmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove assessment from list?</AlertDialogTitle>
            <AlertDialogDescription>
              The assessment will be moved to the &quot;Deleted&quot; section below. Client data is kept and you can restore it anytime. Restore from the Deleted section to bring it back to the active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteAssessmentId !== null) {
                  deleteAssessmentMutation.mutate(deleteAssessmentId);
                }
              }}
            >
              {deleteAssessmentMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assessment Detail Dialog */}
      <Dialog open={!!selectedAssessmentId} onOpenChange={(open) => { if (!open) { setSelectedAssessmentId(null); setCreateProposalResult(null); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assessment Details</DialogTitle>
            <DialogDescription>
              {selectedAssessment ? `Full assessment information for ${selectedAssessment.name}` : "Loading…"}
            </DialogDescription>
          </DialogHeader>
          {selectedAssessmentLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!selectedAssessmentLoading && selectedAssessmentError && (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">{selectedAssessmentError.message}</p>
              <p className="text-sm text-muted-foreground mb-4">It may have been deleted. The list has been refreshed—close this to see the current assessments. If you have a database backup, restoring it may recover the full assessment data.</p>
              <Button variant="outline" onClick={() => { setSelectedAssessmentId(null); setCreateProposalResult(null); }}>Close</Button>
            </div>
          )}
          {!selectedAssessmentLoading && !selectedAssessmentError && selectedAssessment && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <p>Name: {selectedAssessment.name}</p>
                <p>Email: {selectedAssessment.email}</p>
                {selectedAssessment.phone && <p>Phone: {selectedAssessment.phone}</p>}
                {selectedAssessment.company && <p>Company: {selectedAssessment.company}</p>}
                {selectedAssessment.role && <p>Role: {selectedAssessment.role}</p>}
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Project Details</h4>
                <div className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  <p className="whitespace-pre-wrap break-words text-foreground">
                    {formatAssessmentDataAsText(selectedAssessment.assessmentData)}
                  </p>
                </div>
              </div>
              {selectedAssessment.pricingBreakdown && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Pricing Breakdown</h4>
                    <div className="bg-muted p-4 rounded-md text-sm overflow-auto">
                      <p className="whitespace-pre-wrap break-words text-foreground">
                        {formatPricingAsText(selectedAssessment.pricingBreakdown)}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex flex-col gap-3">
                <h4 className="font-semibold">Proposal workflow</h4>
                <p className="text-sm text-muted-foreground">
                  Create a professional proposal from this assessment and get a link to send to the client. They can sign in at /client to view and approve it.
                </p>
                {createProposalResult ? (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <p className="text-sm font-medium">Proposal created: {createProposalResult.quoteNumber}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <code className="text-xs bg-background px-2 py-1 rounded truncate max-w-[240px] sm:max-w-none">
                        {createProposalResult.viewUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(createProposalResult.viewUrl);
                          toast({ title: "Link copied", description: "Share this link with your client." });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy link
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={createProposalResult.viewUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open
                        </a>
                      </Button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setCreateProposalResult(null)}>
                      Create another
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-fit"
                    onClick={async () => {
                      if (!selectedAssessmentId) return;
                      try {
                        const res = await apiRequest("POST", `/api/admin/assessments/${selectedAssessmentId}/create-proposal`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || data?.message || "Failed to create proposal");
                        setCreateProposalResult({
                          viewUrl: data.viewUrl,
                          quoteNumber: data.quoteNumber || `#${data.quoteId}`,
                        });
                        toast({
                          title: "Proposal created",
                          description: data.emailSent ? "Client has been emailed the view link and next steps." : "Share the link with your client or have them sign in at /dashboard.",
                        });
                      } catch (e: any) {
                        toast({
                          title: "Error",
                          description: e?.message || "Failed to create proposal",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Create &amp; send proposal
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Contact Details</DialogTitle>
            <DialogDescription>
              Full message from {selectedContact?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <p className="break-words">Name: {selectedContact.name}</p>
                <p className="break-all">Email: {selectedContact.email}</p>
                <p className="break-words">
                  Subject:{" "}
                  {selectedContact.subject ||
                    (selectedContact.projectType
                      ? "Quote Request"
                      : "Contact Submission")}
                </p>
                {selectedContact.phone && (
                  <p className="break-words">Phone: {selectedContact.phone}</p>
                )}
                {selectedContact.company && (
                  <p className="break-words">Company: {selectedContact.company}</p>
                )}
              </div>
              {(selectedContact.projectType ||
                selectedContact.budget ||
                selectedContact.timeframe ||
                selectedContact.pricingEstimate) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Quote Details</h4>
                    {selectedContact.projectType && (
                      <p className="break-words">
                        Project Type: {selectedContact.projectType}
                      </p>
                    )}
                    {selectedContact.budget && (
                      <p className="break-words">
                        Budget: {selectedContact.budget}
                      </p>
                    )}
                    {selectedContact.timeframe && (
                      <p className="break-words">
                        Timeline: {selectedContact.timeframe}
                      </p>
                    )}
                    {selectedContact.newsletter !== undefined && (
                      <p className="break-words">
                        Newsletter: {selectedContact.newsletter ? "Yes" : "No"}
                      </p>
                    )}
                    {selectedContact.pricingEstimate?.estimatedRange && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">
                          Estimated Range
                        </p>
                        <p>
                          {formatCurrency(
                            selectedContact.pricingEstimate.estimatedRange.min
                          )}{" "}
                          –{" "}
                          {formatCurrency(
                            selectedContact.pricingEstimate.estimatedRange.max
                          )}
                        </p>
                        <p>
                          Average:{" "}
                          {formatCurrency(
                            selectedContact.pricingEstimate.estimatedRange
                              .average
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Message</h4>
                <p className="whitespace-pre-wrap break-words">
                  {selectedContact.message}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
