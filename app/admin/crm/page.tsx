"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

const DEAL_STAGES = ["qualification", "proposal", "negotiation", "won", "lost"];
const CONTACT_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

export default function CrmPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<"lead" | "client" | "">("");
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

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<CrmContact[]>({
    queryKey: ["/api/admin/crm/contacts", typeFilter || undefined],
    queryFn: async () => {
      const url = typeFilter ? `/api/admin/crm/contacts?type=${typeFilter}` : "/api/admin/crm/contacts";
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery<CrmDeal[]>({
    queryKey: ["/api/admin/crm/deals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/deals");
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
      setEditingContact(null);
      toast({ title: "Contact updated" });
    },
    onError: (e: Error) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
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
      estimatedValue: form.estimatedValue ? parseInt(form.estimatedValue, 10) : null,
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
        estimatedValue: form.estimatedValue ? parseInt(form.estimatedValue, 10) : null,
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
      estimatedValue: c.estimatedValue != null ? String(c.estimatedValue) : "",
      notes: c.notes || "",
    });
  };

  const dealsByStage = DEAL_STAGES.map((stage) => ({
    stage,
    deals: deals.filter((d) => d.stage === stage),
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-2">CRM</h1>
        <p className="text-muted-foreground">Leads, clients, and deals</p>
        <Button variant="link" className="px-0 mt-2" asChild>
          <Link href="/admin/crm/personas">Personas &amp; Insights →</Link>
        </Button>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : (v as "lead" | "client"))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add contact
            </Button>
          </div>

          {contactsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No contacts yet. Add leads or clients to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {contacts.map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {c.name}
                          <Badge variant={c.type === "client" ? "default" : "secondary"}>{c.type}</Badge>
                          {c.status && <Badge variant="outline">{c.status}</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>
                          {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                          {c.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.company}</span>}
                        </div>
                        {c.estimatedValue != null && (
                          <div className="text-sm mt-1 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${(c.estimatedValue / 100).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
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
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dealsByStage.map(({ stage, deals: stageDeals }) => (
                <Card key={stage}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{stage}</CardTitle>
                    <CardDescription>{stageDeals.length} deal(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stageDeals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None</p>
                    ) : (
                      stageDeals.map((d) => (
                        <div
                          key={d.id}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <p className="font-medium">{d.title}</p>
                          <p className="text-muted-foreground">
                            {d.contact?.name ?? `Contact #${d.contactId}`}
                          </p>
                          <p className="font-medium text-primary mt-1">
                            ${(d.value / 100).toLocaleString()}
                          </p>
                        </div>
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
              <Label>Est. value (cents)</Label>
              <Input type="number" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))} placeholder="Optional" />
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
  );
}
