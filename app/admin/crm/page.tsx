"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Mail,
  Building2,
  User,
  DollarSign,
  Trash2,
  Edit,
  Phone,
  Target,
  Bell,
  BarChart3,
  FileText,
  Zap,
  Lightbulb,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { intentLevelLabel } from "@/lib/crm-intent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

interface CrmContact {
  id: number;
  type: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  source?: string | null;
  status?: string | null;
  estimatedValue?: number | null;
  notes?: string | null;
  tags?: string[] | null;
  leadScore?: number | null;
  intentLevel?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CrmDeal {
  id: number;
  contactId: number;
  title: string;
  value: number;
  stage: string;
  expectedCloseAt?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  contact?: CrmContact;
}

interface EngagementStats {
  emailOpens: number;
  emailClicks: number;
  documentViews: number;
  highIntentLeadsCount: number;
  unreadAlertsCount: number;
  recentUnreadAlerts?: { id: number; title: string; leadId: number; lead?: { name: string } }[];
  insights?: string[];
}

const DEAL_STAGES = ["qualification", "proposal", "negotiation", "won", "lost"];
const CONTACT_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const INTENT_LEVELS = ["hot_lead", "high_intent", "moderate_intent", "low_intent"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "score", label: "Lead score (high first)" },
  { value: "value", label: "Est. value (high first)" },
  { value: "name", label: "Name A–Z" },
  { value: "status", label: "Status" },
] as const;

export default function CrmPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = searchParams.get("listId");
  const typeFromUrl = searchParams.get("type") as "lead" | "client" | null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<"lead" | "client" | "">(
    typeFromUrl === "lead" || typeFromUrl === "client" ? typeFromUrl : ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [intentFilter, setIntentFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["value"]>("newest");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const addFromCardInputRef = useRef<HTMLInputElement>(null);
  const [addFromCardLoading, setAddFromCardLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null);
  const [form, setForm] = useState({
    type: "lead",
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    industry: "",
    source: "",
    status: "new",
    estimatedValue: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeFromUrl === "lead" || typeFromUrl === "client") setTypeFilter(typeFromUrl);
  }, [typeFromUrl]);

  const { data: contactsFromApi = [], isLoading: contactsLoading } = useQuery<CrmContact[]>({
    queryKey: ["/api/admin/crm/contacts", typeFilter || undefined],
    queryFn: async () => {
      const url = typeFilter ? `/api/admin/crm/contacts?type=${typeFilter}` : "/api/admin/crm/contacts";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !listId,
  });

  const { data: savedListData, isLoading: savedListLoading } = useQuery<{ contacts: CrmContact[]; name: string }>({
    queryKey: ["/api/admin/crm/saved-lists", listId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/saved-lists/${listId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!listId,
  });

  const contacts = listId ? (savedListData?.contacts ?? []) : contactsFromApi;
  const contactsLoadingState = listId ? savedListLoading : contactsLoading;

  const { data: deals = [], isLoading: dealsLoading } = useQuery<CrmDeal[]>({
    queryKey: ["/api/admin/crm/deals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/deals");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: engagement } = useQuery<EngagementStats>({
    queryKey: ["/api/admin/crm/analytics/engagement"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/analytics/engagement");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/admin/crm/contacts", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      setAddOpen(false);
      setForm({ type: "lead", name: "", email: "", phone: "", company: "", jobTitle: "", industry: "", source: "", status: "new", estimatedValue: "", notes: "" });
      toast({ title: "Contact added" });
    },
    onError: (e: Error) => toast({ title: "Failed to add contact", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/contacts/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      setEditingContact(null);
      toast({ title: "Contact updated" });
    },
    onError: (e: Error) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const quickStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/contacts/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Status updated" });
    },
    onError: (e: Error) => toast({ title: "Failed to update status", description: e.message, variant: "destructive" }),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      await Promise.all(ids.map((id) => apiRequest("PATCH", `/api/admin/crm/contacts/${id}`, { status })));
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      setSelectedIds(new Set());
      setBulkStatusOpen(false);
      toast({ title: `${ids.length} contact(s) updated` });
    },
    onError: (e: Error) => toast({ title: "Bulk update failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/crm/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Contact deleted" });
    },
    onError: (e: Error) => toast({ title: "Failed to delete", description: e.message, variant: "destructive" }),
  });

  const scanCardForNewMutation = useMutation({
    mutationFn: async (imageDataUrl: string) => {
      const res = await apiRequest("POST", "/api/admin/crm/business-card", { image: imageDataUrl });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Scan failed");
      }
      return res.json();
    },
    onSuccess: (data: { extracted?: { name?: string; email?: string; phone?: string; company?: string; jobTitle?: string; website?: string; address?: string } }) => {
      const e = data.extracted ?? {};
      const notes = [e.website && `Website: ${e.website}`, e.address && `Address: ${e.address}`].filter(Boolean).join("\n");
      setForm({
        type: "lead",
        name: e.name ?? "",
        email: e.email ?? "",
        phone: e.phone ?? "",
        company: e.company ?? "",
        jobTitle: e.jobTitle ?? "",
        industry: "",
        source: "business card",
        status: "new",
        estimatedValue: "",
        notes,
      });
      setAddOpen(true);
      setAddFromCardLoading(false);
      if (addFromCardInputRef.current) addFromCardInputRef.current.value = "";
      toast({ title: "Card scanned", description: "Review and save the contact." });
    },
    onError: (e: Error) => {
      setAddFromCardLoading(false);
      toast({ title: "Card scan failed", description: e.message, variant: "destructive" });
    },
  });

  const handleAddFromCardFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setAddFromCardLoading(true);
    const reader = new FileReader();
    reader.onload = () => scanCardForNewMutation.mutate(reader.result as string);
    reader.onerror = () => {
      setAddFromCardLoading(false);
      toast({ title: "Could not read image", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isAdmin || !user?.adminApproved) return null;

  const submitAdd = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Name and email required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      type: form.type,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      jobTitle: form.jobTitle.trim() || null,
      industry: form.industry.trim() || null,
      source: form.source.trim() || null,
      status: form.status,
      estimatedValue: form.estimatedValue ? Math.round(parseFloat(form.estimatedValue) * 100) : null,
      notes: form.notes.trim() || null,
    });
  };

  const submitEdit = () => {
    if (!editingContact || !form.name.trim() || !form.email.trim()) return;
    updateMutation.mutate({
      id: editingContact.id,
      body: {
        type: form.type,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        jobTitle: form.jobTitle.trim() || null,
        industry: form.industry.trim() || null,
        source: form.source.trim() || null,
        status: form.status,
        estimatedValue: form.estimatedValue ? Math.round(parseFloat(form.estimatedValue) * 100) : null,
        notes: form.notes.trim() || null,
      },
    });
  };

  const openEdit = (c: CrmContact) => {
    setEditingContact(c);
    setForm({
      type: c.type,
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      company: c.company || "",
      jobTitle: c.jobTitle || "",
      industry: c.industry || "",
      source: c.source || "",
      status: c.status || "new",
      estimatedValue: c.estimatedValue != null ? String(c.estimatedValue / 100) : "",
      notes: c.notes || "",
    });
  };

  const dealsByStage = DEAL_STAGES.map((stage) => ({
    stage,
    deals: deals.filter((d) => d.stage === stage),
  }));

  const filteredContacts = (() => {
    let list = [...contacts];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((c) => (c.status ?? "new") === statusFilter);
    if (intentFilter) list = list.filter((c) => (c.intentLevel ?? "") === intentFilter);
    if (sortBy === "newest")
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "score")
      list.sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0));
    else if (sortBy === "value")
      list.sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0));
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "status")
      list.sort((a, b) => (a.status ?? "").localeCompare(b.status ?? ""));
    return list;
  })();

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
  };

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-1" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
              <p className="text-muted-foreground mt-0.5">Leads, clients, and deals</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1.5 mt-4 p-1 rounded-xl bg-muted/50 border border-border/50 w-fit">
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/dashboard">Overview</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/accounts">Accounts</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/pipeline">Pipeline</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/tasks">Tasks</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/personas">Personas</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/sequences">Sequences</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/saved-lists">Saved lists</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" asChild>
              <Link href="/admin/crm/import">Import</Link>
            </Button>
          </nav>
        </header>

        {engagement && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="overflow-hidden border-0 shadow-sm bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Email opens</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{engagement.emailOpens}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-sm bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Email clicks</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{engagement.emailClicks}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-sm bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Proposal views</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{engagement.documentViews}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-sm bg-card hover:shadow-md hover:border-amber-500/30 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">High intent leads</CardTitle>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{engagement.highIntentLeadsCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

      {engagement?.recentUnreadAlerts && engagement.recentUnreadAlerts.length > 0 && (
        <Card className="mb-6 border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="rounded-lg bg-primary/10 p-1.5"><Bell className="h-4 w-4 text-primary" /></span>
              Recent activity
            </CardTitle>
            <CardDescription>Proposal opens, site revisits, and engagement alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0 divide-y">
              {engagement.recentUnreadAlerts.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/crm/${a.leadId}`}
                    className="flex items-center justify-between text-sm py-3 px-1 -mx-1 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-muted-foreground">{a.title}</span>
                    <span className="font-medium text-primary">{a.lead?.name ?? `Lead #${a.leadId}`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {engagement?.insights && engagement.insights.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="rounded-lg bg-primary/20 p-1.5"><Lightbulb className="h-4 w-4 text-primary" /></span>
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {engagement.insights.map((s, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {listId && savedListData?.name && (
        <div className="mb-4 rounded-xl border bg-muted/40 px-4 py-3 flex items-center justify-between shadow-sm">
          <span className="text-sm">Viewing saved list: <strong>{savedListData.name}</strong></span>
          <Button variant="outline" size="sm" asChild><Link href="/admin/crm">Show all contacts</Link></Button>
        </div>
      )}

      <Tabs defaultValue="contacts" className="mt-2">
        <TabsList className="inline-flex flex-nowrap items-center gap-1 p-1.5 min-h-[44px] rounded-lg bg-muted/80 [&>button]:shrink-0 [&>button]:min-h-[40px]">
          <TabsTrigger value="contacts" className="rounded-lg data-[state=active]:shadow-sm">Contacts</TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg data-[state=active]:shadow-sm">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          <div className="space-y-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-muted-foreground/20 focus-visible:ring-2"
                />
              </div>
              <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : (v as "lead" | "client"))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {CONTACT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={intentFilter || "all"} onValueChange={(v) => setIntentFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All intent</SelectItem>
                  {INTENT_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{intentLevelLabel(l)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-md border border-input overflow-hidden">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "pipeline" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode("pipeline")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <input
                ref={addFromCardInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                aria-label="Add contact from business card"
                onChange={handleAddFromCardFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFromCardInputRef.current?.click()}
                disabled={addFromCardLoading || scanCardForNewMutation.isPending}
              >
                {addFromCardLoading || scanCardForNewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Add from card
              </Button>
              <Button onClick={() => setAddOpen(true)} className="ml-auto rounded-xl shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add contact
              </Button>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-primary/5 border-primary/20 px-4 py-2.5">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <DropdownMenu open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Update status <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {CONTACT_STATUSES.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), status: s })}
                        disabled={bulkStatusMutation.isPending}
                      >
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {contactsLoadingState ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading contacts…</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <Card className="border-dashed overflow-hidden">
              <CardContent className="py-16 text-center">
                <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">
                  {contacts.length === 0 ? "No contacts yet" : "No matches"}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {contacts.length === 0
                    ? "Add leads or clients to get started, or import from a spreadsheet."
                    : "Try adjusting search or filters."}
                </p>
                {contacts.length === 0 && (
                  <Button onClick={() => setAddOpen(true)} className="mt-4 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" /> Add contact
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "pipeline" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
              {CONTACT_STATUSES.map((status) => {
                const columnContacts = filteredContacts.filter((c) => (c.status ?? "new") === status);
                return (
                  <Card key={status} className="min-w-[200px] flex flex-col max-h-[70vh] overflow-hidden rounded-xl border shadow-sm">
                    <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                      <CardTitle className="text-sm font-semibold capitalize">{status}</CardTitle>
                      <CardDescription className="text-xs font-medium">{columnContacts.length} contact{columnContacts.length !== 1 ? "s" : ""}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-2 p-3">
                      {columnContacts.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border bg-card p-3 text-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                        >
                          <Link href={`/admin/crm/${c.id}`} className="font-medium hover:underline block truncate">
                            {c.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{c.email}</p>
                          {(c.leadScore != null || c.estimatedValue != null) && (
                            <div className="flex gap-2 mt-1.5 text-xs">
                              {c.leadScore != null && <span className="text-muted-foreground">Score {c.leadScore}</span>}
                              {c.estimatedValue != null && (
                                <span className="text-primary font-medium">${(c.estimatedValue / 100).toLocaleString()}</span>
                              )}
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-full mt-2 text-xs justify-between rounded-lg">
                                {(c.status ?? "new")} <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {CONTACT_STATUSES.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => quickStatusMutation.mutate({ id: c.id, status: s })}
                                  disabled={quickStatusMutation.isPending}
                                >
                                  {s}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 py-2 px-1 text-sm text-muted-foreground">
                <Checkbox
                  checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
                <span>Select all</span>
              </div>
              {filteredContacts.map((c) => (
                <Card key={c.id} className="overflow-hidden rounded-xl border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                  <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                        aria-label={`Select ${c.name}`}
                        className="shrink-0"
                      />
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {getInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          <Link href={`/admin/crm/${c.id}`} className="hover:underline hover:text-primary transition-colors">
                            {c.name}
                          </Link>
                          <Badge variant={c.type === "client" ? "default" : "secondary"} className="rounded-md">{c.type}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg">
                                {c.status ?? "new"} <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {CONTACT_STATUSES.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => quickStatusMutation.mutate({ id: c.id, status: s })}
                                  disabled={quickStatusMutation.isPending}
                                >
                                  {s}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {c.leadScore != null && (
                            <Badge variant="secondary" className="font-mono rounded-md">Score {c.leadScore}</Badge>
                          )}
                          {c.intentLevel && (
                            <Badge variant="secondary" className="rounded-md">{intentLevelLabel(c.intentLevel)}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" /> {c.email}</span>
                          {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {c.phone}</span>}
                          {c.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3 shrink-0" /> {c.company}</span>}
                        </div>
                        {c.estimatedValue != null && (
                          <div className="text-sm mt-1 flex items-center gap-1 text-primary font-medium">
                            <DollarSign className="h-3 w-3" />
                            ${(c.estimatedValue / 100).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="rounded-lg" asChild>
                        <Link href={`/admin/crm/${c.id}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => openEdit(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          {dealsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading deals…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dealsByStage.map(({ stage, deals: stageDeals }) => (
                <Card key={stage} className="rounded-xl border shadow-sm overflow-hidden">
                  <CardHeader className="pb-2 bg-muted/30 border-b">
                    <CardTitle className="text-sm font-semibold capitalize">{stage}</CardTitle>
                    <CardDescription className="text-xs">{stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    {stageDeals.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">None</p>
                    ) : (
                      stageDeals.map((d) => (
                        <Link
                          key={d.id}
                          href={`/admin/crm/${d.contactId}`}
                          className="block rounded-xl border p-3 text-sm hover:shadow-md hover:border-primary/20 hover:bg-muted/30 transition-all duration-200"
                        >
                          <p className="font-medium truncate">{d.title}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {d.contact?.name ?? `Contact #${d.contactId}`}
                          </p>
                          <p className="font-semibold text-primary mt-1.5">
                            ${(d.value / 100).toLocaleString()}
                          </p>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
            <DialogDescription>Lead or client</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTACT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Job title</Label>
                <Input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="Job title" />
              </div>
              <div>
                <Label>Industry</Label>
                <Input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="Industry" />
              </div>
            </div>
            <div>
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. website, referral" />
            </div>
            <div>
              <Label>Est. value ($)</Label>
              <Input type="number" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))} placeholder="e.g. 5000" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submitAdd} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTACT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingContact(null)}>Cancel</Button>
                <Button onClick={submitEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
