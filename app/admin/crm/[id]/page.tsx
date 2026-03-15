"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  Target,
  FileText,
  Activity,
  MessageSquare,
  Globe,
  Zap,
  Calendar,
  CheckSquare,
  Linkedin,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { intentLevelLabel } from "@/lib/crm-intent";
import { format } from "date-fns";

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
  leadScore?: number | null;
  intentLevel?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface DocumentEvent {
  id: number;
  documentId: string;
  documentType: string;
  viewCount: number;
  firstViewedAt: string;
  lastViewedAt: string;
  totalViewTimeSeconds?: number | null;
  lastEventDetail?: string | null;
}

interface CommunicationEvent {
  id: number;
  eventType: string;
  emailId?: string | null;
  createdAt: string;
}

export default function CrmLeadProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = Number(params?.id);
  const [noteText, setNoteText] = useState("");

  const { data: contact, isLoading: contactLoading } = useQuery<CrmContact>({
    queryKey: ["/api/admin/crm/contacts", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: timelineData } = useQuery<{ timeline: TimelineItem[] }>({
    queryKey: ["/api/admin/crm/contacts", id, "timeline"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${id}/timeline`);
      if (!res.ok) throw new Error("Failed to load timeline");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: docEvents } = useQuery<DocumentEvent[]>({
    queryKey: ["/api/admin/crm/contacts", id, "document-events"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${id}/document-events`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: commEvents } = useQuery<CommunicationEvent[]>({
    queryKey: ["/api/admin/crm/contacts", id, "communication-events"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/contacts/${id}/communication-events`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery<CrmTask[]>({
    queryKey: ["/api/admin/crm/tasks", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/tasks?contactId=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/contacts/${id}/enrich`);
      if (!res.ok) throw new Error("Enrich failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
      toast({ title: "Contact enriched" });
    },
    onError: () => toast({ title: "Enrichment failed", variant: "destructive" }),
  });

  const addTaskMutation = useMutation({
    mutationFn: async (body: { title: string; type: string; priority: string; dueAt?: string }) => {
      const res = await apiRequest("POST", "/api/admin/crm/tasks", { contactId: id, ...body });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      setNewTaskTitle("");
      toast({ title: "Task added" });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/tasks/${taskId}`, { completedAt: new Date().toISOString() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      toast({ title: "Task completed" });
    },
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addNoteMutation = useMutation({
    mutationFn: async (body: { subject: string; body: string }) => {
      const res = await apiRequest("POST", "/api/admin/crm/activities", {
        contactId: id,
        type: "note",
        subject: body.subject,
        body: body.body,
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
      toast({ title: "Note added" });
    },
  });

  useEffect(() => {
    if (contact === null || (contact && !contact.id)) router.push("/admin/crm");
  }, [contact, router]);

  if (contactLoading || !contact) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const timeline = timelineData?.timeline ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => enrichMutation.mutate()}
          disabled={enrichMutation.isPending}
        >
          {enrichMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Enrich contact
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {contact.name}
                  <Badge variant={contact.type === "client" ? "default" : "secondary"}>{contact.type}</Badge>
                  {contact.status && <Badge variant="outline">{contact.status}</Badge>}
                  {contact.intentLevel && (
                    <Badge variant="secondary">{intentLevelLabel(contact.intentLevel)}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>
                  {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
                  {contact.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {contact.company}</span>}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {contact.leadScore != null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Lead score</p>
                    <p className="text-xl font-semibold">{contact.leadScore}</p>
                  </div>
                )}
                {contact.estimatedValue != null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Est. value</p>
                    <p className="text-xl font-semibold text-primary">${(contact.estimatedValue / 100).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(contact.source || contact.industry || contact.jobTitle || (contact as { linkedinUrl?: string }).linkedinUrl) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
                {contact.source && <span>Source: {contact.source}</span>}
                {contact.industry && <span>Industry: {contact.industry}</span>}
                {contact.jobTitle && <span>Role: {contact.jobTitle}</span>}
                {(contact as { linkedinUrl?: string }).linkedinUrl && (
                  <a href={(contact as { linkedinUrl: string }).linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </a>
                )}
              </div>
            )}
            {contact.notes && (
              <p className="text-sm border-l-2 border-muted pl-3">{contact.notes}</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="proposal">Proposal activity</TabsTrigger>
            <TabsTrigger value="email">Email engagement</TabsTrigger>
            <TabsTrigger value="notes">Add note</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Activity timeline</CardTitle>
                <CardDescription>Form submissions, emails, document views, and site visits</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {timeline.map((item) => (
                      <li key={item.id} className="flex gap-3 border-l-2 border-muted pl-4 py-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(item.createdAt), "PPp")}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tasks</CardTitle>
                <CardDescription>Follow-ups, calls, and to-dos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="New task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTaskMutation.mutate({ title: newTaskTitle.trim(), type: "follow_up", priority: "medium" })}
                  />
                  <Button
                    size="sm"
                    onClick={() => addTaskMutation.mutate({ title: newTaskTitle.trim(), type: "follow_up", priority: "medium" })}
                    disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
                  >
                    Add
                  </Button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className={t.completedAt ? "opacity-60" : ""}>
                          <p className="font-medium text-sm">{t.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.type} · {t.priority}
                            {t.dueAt && ` · Due ${format(new Date(t.dueAt), "PP")}`}
                          </p>
                        </div>
                        {!t.completedAt && (
                          <Button variant="ghost" size="sm" onClick={() => completeTaskMutation.mutate(t.id)} disabled={completeTaskMutation.isPending}>
                            Mark done
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="proposal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Proposal & document engagement</CardTitle>
                <CardDescription>Views, time spent, and downloads</CardDescription>
              </CardHeader>
              <CardContent>
                {(!docEvents || docEvents.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No document activity yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {docEvents.map((e) => (
                      <li key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium capitalize">{e.documentType}</p>
                          <p className="text-xs text-muted-foreground">
                            Viewed {e.viewCount} time{e.viewCount !== 1 ? "s" : ""}
                            {e.totalViewTimeSeconds != null && e.totalViewTimeSeconds > 0 && ` · ${Math.round(e.totalViewTimeSeconds / 60)} min total`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            First: {format(new Date(e.firstViewedAt), "PPp")} · Last: {format(new Date(e.lastViewedAt), "PPp")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email engagement</CardTitle>
                <CardDescription>Opens, clicks, and replies</CardDescription>
              </CardHeader>
              <CardContent>
                {(!commEvents || commEvents.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No email events yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {commEvents.map((e) => (
                      <li key={e.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <span className="capitalize">{e.eventType}</span>
                        <span className="text-muted-foreground">{e.emailId && `· ${e.emailId}`} {format(new Date(e.createdAt), "PPp")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Add internal note</CardTitle>
                <CardDescription>Visible only to your team</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  className="mb-3"
                />
                <Button
                  onClick={() => addNoteMutation.mutate({ subject: "Note", body: noteText })}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                >
                  {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add note"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
