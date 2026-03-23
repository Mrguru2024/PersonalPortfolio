"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, Eye, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CRM_PIPELINE_STAGES } from "@/lib/crm-pipeline-stages";
import { getPipelineStageLabel } from "@/lib/crm-pipeline-stages";

interface SavedList {
  id: number;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

const LIFECYCLE_OPTIONS = ["cold", "warm", "qualified", "sales_ready"];
const INTENT_OPTIONS = ["low_intent", "moderate_intent", "high_intent", "hot_lead"];

export default function CrmSavedListsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [intentLevel, setIntentLevel] = useState("");
  const [source, setSource] = useState("");
  const [pipelineStage, setPipelineStage] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState("");
  const [hasResearch, setHasResearch] = useState<string>("");
  const [tagsStr, setTagsStr] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: lists = [], isLoading } = useQuery<SavedList[]>({
    queryKey: ["/api/admin/crm/saved-lists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/saved-lists");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const filters: Record<string, unknown> = {};
      if (type) filters.type = type;
      if (status) filters.status = status;
      if (intentLevel) filters.intentLevel = intentLevel;
      if (source) filters.source = source;
      if (pipelineStage) filters.pipelineStage = pipelineStage;
      if (lifecycleStage) filters.lifecycleStage = lifecycleStage;
      if (hasResearch === "yes") filters.hasResearch = true;
      if (hasResearch === "no") filters.hasResearch = false;
      if (tagsStr.trim()) filters.tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await apiRequest("POST", "/api/admin/crm/saved-lists", { name: name.trim(), filters });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/saved-lists"] });
      setCreateOpen(false);
      setName("");
      setType(""); setStatus(""); setIntentLevel(""); setSource("");
      setPipelineStage(""); setLifecycleStage(""); setHasResearch(""); setTagsStr("");
      toast({ title: "Saved list created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading) return <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/crm"><ArrowLeft className="h-4 w-4 mr-2" /> Back to CRM</Link>
      </Button>
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-2xl font-bold">Saved lists</h1>
          <p className="text-muted-foreground text-sm mt-1">Prospect groups by filters. View contacts that match.</p>
        </div>
        <Button onClick={() => setCreateOpen(!createOpen)}>
          <Plus className="h-4 w-4 mr-2" /> New list
        </Button>
      </div>

      {createOpen && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create saved list</CardTitle>
            <CardDescription>Set filters to define this prospect group.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High intent, no research" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Intent level</Label>
                <Select value={intentLevel} onValueChange={setIntentLevel}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {INTENT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pipeline stage</Label>
                <Select value={pipelineStage} onValueChange={setPipelineStage}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {CRM_PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{getPipelineStageLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lifecycle stage</Label>
                <Select value={lifecycleStage} onValueChange={setLifecycleStage}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {LIFECYCLE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Has research</Label>
                <Select value={hasResearch} onValueChange={setHasResearch}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Source (exact)</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. website, referral" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="high_intent, audit_interested" />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create list"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : lists.length === 0 ? (
        <Card className="mt-6"><CardContent className="py-12 text-center text-muted-foreground">No saved lists. Create one above.</CardContent></Card>
      ) : (
        <div className="mt-6 space-y-2">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className="text-xs text-muted-foreground">{Object.keys((list.filters as object) || {}).length ? JSON.stringify(list.filters) : "No filters"}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/crm?listId=${list.id}`}><Eye className="h-4 w-4 mr-2" /> View contacts</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
