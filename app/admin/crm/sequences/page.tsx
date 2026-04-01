"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, Plus, ListOrdered, UserPlus, Users, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CrmSequence {
  id: number;
  name: string;
  description: string | null;
  steps: Array<{ type: string; waitDays: number; subject?: string; taskTitle?: string }>;
  isActive: boolean;
}

type EnrollMode = "leads" | "contacts" | "pick" | "ids" | "new";
type PickRow = { id: number; name: string; email: string };

export default function CrmSequencesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [enrollSequenceId, setEnrollSequenceId] = useState<number | null>(null);
  const [enrollMode, setEnrollMode] = useState<EnrollMode>("leads");
  const [idsRaw, setIdsRaw] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [pickSearch, setPickSearch] = useState("");
  const [pickDebounced, setPickDebounced] = useState("");
  const [pickResults, setPickResults] = useState<PickRow[]>([]);
  const [pickLoading, setPickLoading] = useState(false);
  const [pickIds, setPickIds] = useState<number[]>([]);
  const [pickHydrated, setPickHydrated] = useState<PickRow[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setPickDebounced(pickSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [pickSearch]);

  useEffect(() => {
    if (pickDebounced.length < 2) {
      setPickResults([]);
      return;
    }
    let cancelled = false;
    setPickLoading(true);
    void fetch(`/api/admin/crm/contacts?search=${encodeURIComponent(pickDebounced)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: unknown) => {
        if (cancelled || !Array.isArray(rows)) {
          setPickResults([]);
          return;
        }
        setPickResults(
          rows.map((r) => {
            const row = r as PickRow;
            return { id: row.id, name: row.name, email: row.email };
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setPickResults([]);
      })
      .finally(() => {
        if (!cancelled) setPickLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickDebounced]);

  const pickKey = [...pickIds].sort((a, b) => a - b).join(",");
  useEffect(() => {
    if (pickIds.length === 0) {
      setPickHydrated([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/admin/crm/contacts?ids=${pickIds.join(",")}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: unknown) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map = new Map(rows.map((r) => [ (r as PickRow).id, r as PickRow]));
        setPickHydrated(pickIds.map((id) => map.get(id)).filter(Boolean) as PickRow[]);
      })
      .catch(() => {
        if (!cancelled) setPickHydrated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pickKey]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: sequences = [], isLoading } = useQuery<CrmSequence[]>({
    queryKey: ["/api/admin/crm/sequences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/sequences");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (enrollSequenceId == null) throw new Error("No sequence");
      const sequenceId = enrollSequenceId;
      if (enrollMode === "leads") {
        const res = await apiRequest("POST", "/api/admin/crm/sequences/enroll", { sequenceId, enrollAllLeads: true });
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<{ enrollments: unknown[]; skipped?: number }>;
      }
      if (enrollMode === "contacts") {
        const res = await apiRequest("POST", "/api/admin/crm/sequences/enroll", { sequenceId, enrollAllContacts: true });
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<{ enrollments: unknown[]; skipped?: number }>;
      }
      if (enrollMode === "new") {
        if (!newName.trim() || !newEmail.trim()) throw new Error("Name and email required");
        const res = await apiRequest("POST", "/api/admin/crm/sequences/enroll", {
          sequenceId,
          newContact: { name: newName.trim(), email: newEmail.trim(), phone: newPhone.trim() || undefined },
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<{ enrollments: unknown[]; skipped?: number }>;
      }
      if (enrollMode === "pick") {
        const ids = [...new Set(pickIds.filter((n) => Number.isFinite(n) && n > 0))];
        if (ids.length === 0) throw new Error("Search and add at least one contact");
        const res = await apiRequest("POST", "/api/admin/crm/sequences/enroll", { sequenceId, contactIds: ids });
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<{ enrollments: unknown[]; skipped?: number }>;
      }
      const ids = [...new Set(idsRaw.split(/[\s,]+/).map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0))];
      if (ids.length === 0) throw new Error("Enter at least one contact ID");
      const res = await apiRequest("POST", "/api/admin/crm/sequences/enroll", { sequenceId, contactIds: ids });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ enrollments: unknown[]; skipped?: number }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/crm/sequences"] });
      toast({
        title: "Enrolled",
        description: `${data.enrollments?.length ?? 0} enrollment(s) created${typeof data.skipped === "number" && data.skipped > 0 ? ` (${data.skipped} already active)` : ""}.`,
      });
      setEnrollSequenceId(null);
      setIdsRaw("");
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setPickSearch("");
      setPickIds([]);
    },
    onError: (e: Error) => toast({ title: "Enroll failed", description: e.message, variant: "destructive" }),
  });

  if (authLoading) {
    return (
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-4xl">
        <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-2">Email sequences</h1>
        <p className="text-muted-foreground">Multi-step campaigns: emails and tasks with wait days</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : sequences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListOrdered className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No sequences yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Create a sequence to automate follow-up steps (email + wait + task).</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <Card key={seq.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {seq.name}
                    {!seq.isActive && <span className="text-xs font-normal text-muted-foreground">(paused)</span>}
                  </CardTitle>
                  {seq.description && <CardDescription>{seq.description}</CardDescription>}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/crm?enrollSequence=${seq.id}`}>Enroll leads</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{seq.steps?.length ?? 0} steps</p>
                <ul className="space-y-1 text-sm">
                  {seq.steps?.slice(0, 5).map((step, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {step.type === "email" ? <Mail className="h-3 w-3" /> : <ListOrdered className="h-3 w-3" />}
                      {step.type === "email" ? (step.subject || "Email") : (step.taskTitle || "Task")} — wait {step.waitDays} day(s)
                    </li>
                  ))}
                  {(seq.steps?.length ?? 0) > 5 && <li className="text-muted-foreground">+{(seq.steps?.length ?? 0) - 5} more</li>}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        <div className="mt-6">
          <Button asChild>
            <Link href="/admin/crm/sequences/new">
              <Plus className="h-4 w-4 mr-2" />
              New sequence
            </Link>
          </Button>
        </div>
      </div>

      <Dialog open={enrollSequenceId != null} onOpenChange={(o) => !o && setEnrollSequenceId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in sequence</DialogTitle>
            <DialogDescription>
              Same choices as communications and newsletter CRM sends: all leads, everyone in CRM, search and select
              contacts, paste IDs, or create a new contact. Already-active enrollments for the same contact are skipped.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={enrollMode}
            onValueChange={(v) => setEnrollMode(v as EnrollMode)}
            className="flex flex-col gap-3 py-2"
          >
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="leads" id="en-leads" />
              <span>All leads in CRM</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="contacts" id="en-all" />
              <span>Everyone in CRM (all leads and clients)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="pick" id="en-pick" />
              <span>Selected contacts (search CRM)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="ids" id="en-ids" />
              <span>Paste contact IDs</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="new" id="en-new" />
              <span className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" /> New contact
              </span>
            </label>
          </RadioGroup>
          {enrollMode === "pick" ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div>
                <Label htmlFor="seq-pick-search">Search CRM</Label>
                <Input
                  id="seq-pick-search"
                  value={pickSearch}
                  onChange={(e) => setPickSearch(e.target.value)}
                  placeholder="Name or email (2+ characters)"
                  className="mt-1"
                />
                {pickLoading ? <p className="text-xs text-muted-foreground mt-1">Searching…</p> : null}
              </div>
              {pickResults.length > 0 ? (
                <ul className="text-sm space-y-1 border rounded-md p-2 bg-muted/30">
                  {pickResults.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {row.name} <span className="text-muted-foreground">{row.email}</span>
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!row.email?.trim() || pickIds.includes(row.id)}
                        onClick={() => setPickIds((p) => (p.includes(row.id) ? p : [...p, row.id]))}
                      >
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {pickHydrated.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pickHydrated.map((row) => (
                    <Badge key={row.id} variant="secondary" className="gap-1 pr-1 font-normal">
                      <span className="max-w-[120px] truncate">{row.name || row.email}</span>
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-muted"
                        aria-label={`Remove ${row.email}`}
                        onClick={() => setPickIds((p) => p.filter((id) => id !== row.id))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : pickIds.length > 0 ? (
                <p className="text-xs text-muted-foreground">Loading selection…</p>
              ) : (
                <p className="text-xs text-muted-foreground">Search and add one or more contacts.</p>
              )}
            </div>
          ) : null}
          {enrollMode === "ids" ? (
            <div className="space-y-2">
              <Label htmlFor="enroll-ids">Contact IDs (comma or space separated)</Label>
              <Input
                id="enroll-ids"
                value={idsRaw}
                onChange={(e) => setIdsRaw(e.target.value)}
                placeholder="e.g. 12, 48, 103"
              />
            </div>
          ) : null}
          {enrollMode === "new" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="en-name">Name</Label>
                <Input id="en-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label htmlFor="en-email">Email</Label>
                <Input id="en-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="en-phone">Phone (optional)</Label>
                <Input id="en-phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEnrollSequenceId(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
