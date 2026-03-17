"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Video,
  Loader2,
  Save,
  Building2,
  User,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const NOTE_SECTION_KEYS = [
  "business_overview",
  "current_problems",
  "goals",
  "budget_timeline",
  "website_funnel_findings",
  "service_fit",
  "objections",
  "action_items",
] as const;
const NOTE_LABELS: Record<string, string> = {
  business_overview: "Business overview",
  current_problems: "Current problems",
  goals: "Goals",
  budget_timeline: "Budget & timeline",
  website_funnel_findings: "Website / funnel findings",
  service_fit: "Service fit",
  objections: "Objections / concerns",
  action_items: "Action items",
};

const FIT_OPTIONS = ["low_fit", "unclear_fit", "promising", "high_fit", "nurture"];
const READINESS_OPTIONS = ["missing_key_data", "early", "qualified", "proposal_ready"];
const STATUS_OPTIONS = ["draft", "scheduled", "completed", "cancelled"];

function CreateFollowUpTasksButton({
  workspaceId,
  onSuccess,
  onError,
}: {
  workspaceId: string;
  onSuccess: () => void;
  onError: () => void;
}) {
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/discovery/${workspaceId}/create-follow-up-tasks`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess,
    onError,
  });
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTodo className="h-4 w-4 mr-2" />}
      Create tasks from follow-up items
    </Button>
  );
}

export default function DiscoveryWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localOutcome, setLocalOutcome] = useState<Record<string, string | string[]>>({});

  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ["/api/admin/crm/discovery", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/discovery/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!id,
  });

  const contactId = workspace?.contactId;
  const { data: contact } = useQuery({
    queryKey: ["/api/admin/crm/contacts", contactId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${contactId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!contactId,
  });

  const { data: questionsData } = useQuery({
    queryKey: ["/api/admin/crm/discovery/questions", contactId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/discovery/questions?contactId=${contactId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!contactId,
  });

  const { data: guidanceData } = useQuery({
    queryKey: ["/api/admin/crm/guidance/contact", contactId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/guidance/contact/${contactId}`);
      if (!res.ok) return { guidance: {} };
      return res.json();
    },
    enabled: !!contactId,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/discovery/${id}`, payload);
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/discovery", id] });
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const notesSections = workspace?.notesSections ?? {};
  const outcome = workspace?.outcome ?? {};
  const mergedNotes = { ...notesSections, ...localNotes };
  const mergedOutcome = { ...outcome, ...localOutcome };

  const handleSaveNotes = () => {
    const sections: Record<string, string> = {};
    NOTE_SECTION_KEYS.forEach((key) => {
      const v = localNotes[key] ?? notesSections[key];
      if (v) sections[key] = v;
    });
    updateMutation.mutate({ notesSections: Object.keys(sections).length ? sections : null });
  };

  const handleSaveOutcome = () => {
    const out: Record<string, unknown> = {};
    if (mergedOutcome.fitVerdict) out.fitVerdict = mergedOutcome.fitVerdict;
    if (mergedOutcome.urgencyVerdict) out.urgencyVerdict = mergedOutcome.urgencyVerdict;
    if (mergedOutcome.budgetConfidence) out.budgetConfidence = mergedOutcome.budgetConfidence;
    if (mergedOutcome.proposalReadiness) out.proposalReadiness = mergedOutcome.proposalReadiness;
    if (mergedOutcome.nurtureRecommendation) out.nurtureRecommendation = mergedOutcome.nurtureRecommendation;
    if (mergedOutcome.disqualifyReason) out.disqualifyReason = mergedOutcome.disqualifyReason;
    if (Array.isArray(mergedOutcome.followUpItems) && mergedOutcome.followUpItems.length > 0) out.followUpItems = mergedOutcome.followUpItems;
    updateMutation.mutate({ outcome: Object.keys(out).length ? out : null });
  };

  const updateField = (field: string, value: unknown) => {
    updateMutation.mutate({ [field]: value });
  };

  if (wsLoading || !workspace) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const leadSummary = guidanceData?.guidance?.lead_summary?.content as { summary?: string } | undefined;
  const prepSummary = leadSummary?.summary ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={contactId ? `/admin/crm/discovery?contactId=${contactId}` : "/admin/crm"}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {workspace.title}
                </CardTitle>
                <CardDescription className="mt-1 flex flex-wrap gap-4">
                  {contact && (
                    <Link href={`/admin/crm/${contactId}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                      <User className="h-3 w-3" /> {contact.name}
                    </Link>
                  )}
                  {workspace.callDate && (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(workspace.callDate), "PPp")}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={workspace.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {workspace.fitAssessment && <Badge variant="secondary">Fit: {workspace.fitAssessment}</Badge>}
                {workspace.readinessAssessment && <Badge variant="outline">Readiness: {workspace.readinessAssessment}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Call date</Label>
                <Input
                  type="datetime-local"
                  value={workspace.callDate ? format(new Date(workspace.callDate), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => updateField("callDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </div>
              <div>
                <Label>Meeting type</Label>
                <Select value={workspace.meetingType ?? ""} onValueChange={(v) => updateField("meetingType", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="kickoff">Kickoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Attended by</Label>
                <Input
                  value={workspace.attendedBy ?? ""}
                  onChange={(e) => updateField("attendedBy", e.target.value || null)}
                  placeholder="Names"
                />
              </div>
              <div>
                <Label>Fit assessment</Label>
                <Select value={workspace.fitAssessment ?? ""} onValueChange={(v) => updateField("fitAssessment", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {FIT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Readiness assessment</Label>
                <Select value={workspace.readinessAssessment ?? ""} onValueChange={(v) => updateField("readinessAssessment", v || null)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {READINESS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea
                value={workspace.summary ?? ""}
                onChange={(e) => updateField("summary", e.target.value || null)}
                placeholder="Call summary"
                rows={3}
              />
            </div>
            <div>
              <Label>Risk summary</Label>
              <Textarea
                value={workspace.riskSummary ?? ""}
                onChange={(e) => updateField("riskSummary", e.target.value || null)}
                placeholder="Risks or concerns"
                rows={2}
              />
            </div>
            <div>
              <Label>Recommended offer direction</Label>
              <Input
                value={workspace.recommendedOfferDirection ?? ""}
                onChange={(e) => updateField("recommendedOfferDirection", e.target.value || null)}
              />
            </div>
            <div>
              <Label>Next step recommendation</Label>
              <Input
                value={workspace.nextStepRecommendation ?? ""}
                onChange={(e) => updateField("nextStepRecommendation", e.target.value || null)}
              />
            </div>
          </CardContent>
        </Card>

        {prepSummary && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">AI prep summary</CardTitle>
              <CardDescription>From lead guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{prepSummary}</p>
            </CardContent>
          </Card>
        )}

        {guidanceData?.guidance && (guidanceData.guidance.qualification_gaps || guidanceData.guidance.risk_warnings) && (
          <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-base">Qualification gaps & risk warnings</CardTitle>
              <CardDescription>From AI guidance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {guidanceData.guidance.qualification_gaps && (
                <div className="rounded-md border bg-background p-3 text-sm">
                  <p className="font-medium">Qualification gaps</p>
                  <p>Completeness: {(guidanceData.guidance.qualification_gaps.content as { overallCompletenessScore?: number })?.overallCompletenessScore ?? 0}%</p>
                  {((guidanceData.guidance.qualification_gaps.content as { missingFields?: string[] })?.missingFields?.length ?? 0) > 0 && (
                    <p className="text-muted-foreground">Missing: {(guidanceData.guidance.qualification_gaps.content as { missingFields?: string[] }).missingFields!.join(", ")}</p>
                  )}
                </div>
              )}
              {guidanceData.guidance.risk_warnings && (
                <div className="rounded-md border bg-background p-3 text-sm">
                  <p className="font-medium">Risk warnings</p>
                  {((guidanceData.guidance.risk_warnings.content as { warnings?: Array<{ label: string; severity: string }> })?.warnings ?? []).map((w: { label: string; severity: string }, i: number) => (
                    <p key={i} className={w.severity === "high" ? "text-amber-700 dark:text-amber-400" : ""}>· {w.label}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {questionsData && (questionsData.recommendedFromAi?.length > 0 || questionsData.default?.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Recommended questions</CardTitle>
              <CardDescription>Default + AI-suggested</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {questionsData.recommendedFromAi?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">From AI</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-sm">
                    {questionsData.recommendedFromAi.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {questionsData.default?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">By category</p>
                  <ul className="space-y-1 text-sm">
                    {questionsData.default.slice(0, 12).map((q: { id: string; category: string; question: string }) => (
                      <li key={q.id}><span className="text-muted-foreground">{q.category}:</span> {q.question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Structured notes</CardTitle>
            <CardDescription>Capture discovery by section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {NOTE_SECTION_KEYS.map((key) => (
              <div key={key}>
                <Label>{NOTE_LABELS[key] ?? key}</Label>
                <Textarea
                  value={localNotes[key] ?? notesSections[key] ?? ""}
                  onChange={(e) => setLocalNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={`${NOTE_LABELS[key] ?? key}…`}
                  rows={2}
                  className="mt-1"
                />
              </div>
            ))}
            <Button onClick={handleSaveNotes} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save notes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discovery outcome</CardTitle>
            <CardDescription>Fit, readiness, follow-up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Fit verdict</Label>
                <Input
                  value={(mergedOutcome.fitVerdict as string) ?? ""}
                  onChange={(e) => setLocalOutcome((p) => ({ ...p, fitVerdict: e.target.value }))}
                />
              </div>
              <div>
                <Label>Urgency verdict</Label>
                <Input
                  value={(mergedOutcome.urgencyVerdict as string) ?? ""}
                  onChange={(e) => setLocalOutcome((p) => ({ ...p, urgencyVerdict: e.target.value }))}
                />
              </div>
              <div>
                <Label>Budget confidence</Label>
                <Input
                  value={(mergedOutcome.budgetConfidence as string) ?? ""}
                  onChange={(e) => setLocalOutcome((p) => ({ ...p, budgetConfidence: e.target.value }))}
                />
              </div>
              <div>
                <Label>Proposal readiness</Label>
                <Input
                  value={(mergedOutcome.proposalReadiness as string) ?? ""}
                  onChange={(e) => setLocalOutcome((p) => ({ ...p, proposalReadiness: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Nurture recommendation</Label>
              <Textarea
                value={(mergedOutcome.nurtureRecommendation as string) ?? ""}
                onChange={(e) => setLocalOutcome((p) => ({ ...p, nurtureRecommendation: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label>Disqualify reason (if any)</Label>
              <Input
                value={(mergedOutcome.disqualifyReason as string) ?? ""}
                onChange={(e) => setLocalOutcome((p) => ({ ...p, disqualifyReason: e.target.value }))}
              />
            </div>
            <div>
              <Label>Follow-up items (one per line; save outcome first)</Label>
              <Textarea
                value={Array.isArray(mergedOutcome.followUpItems) ? mergedOutcome.followUpItems.join("\n") : ""}
                onChange={(e) => setLocalOutcome((p) => ({ ...p, followUpItems: e.target.value ? e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) : [] }))}
                placeholder="Item 1&#10;Item 2"
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveOutcome} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save outcome
              </Button>
              {(Array.isArray(mergedOutcome.followUpItems) ? mergedOutcome.followUpItems : outcome?.followUpItems ?? []).length > 0 && (
                <CreateFollowUpTasksButton
                  workspaceId={id}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contactId, "timeline"] });
                    toast({ title: "Tasks created from follow-up items" });
                  }}
                  onError={() => toast({ title: "Failed to create tasks", variant: "destructive" })}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
