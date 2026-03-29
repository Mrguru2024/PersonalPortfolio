"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Target,
  FileText,
  Activity,
  MessageSquare,
  Zap,
  CheckSquare,
  Linkedin,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ClipboardCheck,
  Video,
  ExternalLink,
  Camera,
  BookOpen,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { intentLevelLabel } from "@/lib/crm-intent";
import { formatLocaleMediumDate, formatLocaleMediumDateTime } from "@/lib/localeDateTime";
import { SocialProfileDiscoveryCard } from "@/components/crm/SocialProfileDiscoveryCard";

interface AfnCommunitySnapshot {
  userId: number;
  username: string;
  founderTribe: string | null;
  founderTribeLabel: string | null;
  headline: string | null;
  profileVisibility: string | null;
  publicProfilePath: string | null;
  isOnboardingComplete: boolean | null;
}

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
  linkedinUrl?: string | null;
  customFields?: Record<string, unknown> | null;
  bookedCallAt?: string | null;
  lastContactedAt?: string | null;
  stripeCustomerId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referringPage?: string | null;
  landingPage?: string | null;
  lifecycleStage?: string | null;
  outreachState?: string | null;
  nurtureState?: string | null;
  sequenceReady?: boolean | null;
  nextFollowUpAt?: string | null;
  doNotContact?: boolean | null;
  nurtureReason?: string | null;
  accountId?: number | null;
  createdAt: string;
  updatedAt: string;
  afnCommunity?: AfnCommunitySnapshot | null;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  metadata?: {
    dealId?: number;
    activityType?: string;
    meetingUrl?: string;
    startUrl?: string;
    meetingId?: string;
    scheduledAt?: string;
    body?: string;
  };
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
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface CrmTask {
  id: number;
  contactId: number;
  type: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  completedNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function PinnedPlaybookCard({
  contact,
  onUpdate,
}: {
  contact: CrmContact;
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const { data: playbooksData } = useQuery<{ playbooks: Array<{ id: number; title: string }> }>({
    queryKey: ["/api/admin/crm/playbooks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/playbooks");
      return res.ok ? res.json() : { playbooks: [] };
    },
  });
  const pinnedId = contact.customFields?.pinnedPlaybookId as number | undefined;
  const updateMutation = useMutation({
    mutationFn: async (playbookId: number | null) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/contacts/${contact.id}`, {
        customFields: { ...(contact.customFields || {}), pinnedPlaybookId: playbookId },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      onUpdate();
      toast({ title: "Playbook updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });
  const playbooks = playbooksData?.playbooks ?? [];
  const pinnedPlaybook = pinnedId ? playbooks.find((p) => p.id === pinnedId) : null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Recommended playbook
        </CardTitle>
        <CardDescription>Pin a sales playbook for this lead</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select
          value={pinnedId != null ? String(pinnedId) : "none"}
          onValueChange={(v) => updateMutation.mutate(v === "none" ? null : Number(v))}
          disabled={updateMutation.isPending}
        >
          <SelectTrigger className="w-full max-w-xs"><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {playbooks.map((pb) => (
              <SelectItem key={pb.id} value={String(pb.id)}>{pb.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pinnedPlaybook && (
          <Button variant="link" className="p-0 h-auto text-primary" asChild>
            <Link href={`/admin/crm/playbooks/${pinnedId}`}>Open &quot;{pinnedPlaybook.title}&quot; →</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function CrmLeadProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = Number(params?.id);
  const [noteText, setNoteText] = useState("");
  const [smsBody, setSmsBody] = useState("");

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

  const { data: insights } = useQuery<{
    contactCompleteness: { score: number; missingFields: string[]; label: string };
    researchCompleteness: { score: number; missingFields: string[]; label: string };
    aiFitScore: number;
    nextBestActions: { action: string; reason: string; priority: string }[];
  }>({
    queryKey: ["/api/admin/crm/insights/contact", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/insights/contact/${id}`);
      if (!res.ok) throw new Error("Failed to load insights");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: guidanceData, refetch: refetchGuidance } = useQuery<{
    guidance: Record<string, { content: Record<string, unknown>; providerType: string; generatedAt: string }>;
  }>({
    queryKey: ["/api/admin/crm/guidance/contact", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/guidance/contact/${id}`);
      if (!res.ok) return { guidance: {} };
      return res.json();
    },
    enabled: !!id,
  });

  const generateGuidanceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/guidance/contact/${id}`);
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: () => {
      refetchGuidance();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      toast({ title: "AI guidance generated" });
    },
    onError: () => toast({ title: "Failed to generate guidance", variant: "destructive" }),
  });

  const acceptRecommendationMutation = useMutation({
    mutationFn: async (payload: { label: string; reason?: string; dealId?: number; accountId?: number }) => {
      const res = await apiRequest("POST", "/api/admin/crm/guidance/recommendation/accept", { contactId: id, ...payload });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      refetchTasks();
      refetchGuidance();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      toast({ title: "Task created from recommendation" });
    },
    onError: () => toast({ title: "Failed to create task", variant: "destructive" }),
  });

  const { data: workflowExecutions = [] } = useQuery<Array<{ id: number; workflowKey: string; triggerType: string; status: string; startedAt?: string }>>({
    queryKey: ["/api/admin/crm/workflows/executions", "contact", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/crm/workflows/executions?entityType=contact&entityId=${id}&limit=5`);
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

  const sendOpsSmsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/contacts/${id}/revenue-ops/sms`, { body: smsBody });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed to send SMS");
      }
      return res.json();
    },
    onSuccess: () => {
      setSmsBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
      toast({ title: "SMS sent" });
    },
    onError: (e: Error) => toast({ title: "SMS failed", description: e.message, variant: "destructive" }),
  });

  const sendBookingLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/crm/contacts/${id}/revenue-ops/booking-link`, {});
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "Failed");
      }
      return res.json() as Promise<{ url?: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      toast({ title: "Booking link sent", description: "Check the timeline for the tracked URL." });
    },
    onError: (e: Error) => toast({ title: "Booking link failed", description: e.message, variant: "destructive" }),
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState("timeline");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [scheduleTopic, setScheduleTopic] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("14:00");
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [scheduleAgenda, setScheduleAgenda] = useState("");
  const [createdMeetingLinks, setCreatedMeetingLinks] = useState<{
    joinUrl?: string;
    startUrl?: string;
    startTime?: string;
  } | null>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [cardScanning, setCardScanning] = useState(false);

  const CONTACT_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

  const [detailEdit, setDetailEdit] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    industry: "",
    source: "",
    linkedinUrl: "",
    estimatedValueDollars: "",
    notes: "",
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async () => {
      const ev = detailEdit.estimatedValueDollars.trim();
      let estimatedValue: number | null = null;
      if (ev) {
        const n = parseFloat(ev);
        if (!Number.isFinite(n) || n < 0) throw new Error("Estimated value must be a valid number.");
        estimatedValue = Math.round(n * 100);
      }
      const res = await apiRequest("PATCH", `/api/admin/crm/contacts/${id}`, {
        name: detailEdit.name.trim(),
        email: detailEdit.email.trim(),
        phone: detailEdit.phone.trim() || null,
        company: detailEdit.company.trim() || null,
        jobTitle: detailEdit.jobTitle.trim() || null,
        industry: detailEdit.industry.trim() || null,
        source: detailEdit.source.trim() || null,
        linkedinUrl: detailEdit.linkedinUrl.trim() || null,
        estimatedValue,
        notes: detailEdit.notes.trim() || null,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Contact details saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!contact) return;
    setDetailEdit({
      name: contact.name,
      email: contact.email,
      phone: contact.phone ?? "",
      company: contact.company ?? "",
      jobTitle: contact.jobTitle ?? "",
      industry: contact.industry ?? "",
      source: contact.source ?? "",
      linkedinUrl: contact.linkedinUrl ?? "",
      estimatedValueDollars: contact.estimatedValue != null ? String(contact.estimatedValue / 100) : "",
      notes: contact.notes ?? "",
    });
  }, [contact?.id, contact?.updatedAt]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/contacts/${id}`, { status });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

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

  const addMeetingMutation = useMutation({
    mutationFn: async (payload: { subject: string; body: string; meetingUrl: string }) => {
      const res = await apiRequest("POST", "/api/admin/crm/activities", {
        contactId: id,
        type: "meeting",
        subject: payload.subject,
        body: payload.body || null,
        metadata: { meetingUrl: payload.meetingUrl },
      });
      if (!res.ok) throw new Error("Failed to log meeting");
      return res.json();
    },
    onSuccess: () => {
      setMeetingTitle("");
      setMeetingUrl("");
      setMeetingNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      toast({ title: "Zoom meeting logged" });
    },
    onError: () => toast({ title: "Failed to log meeting", variant: "destructive" }),
  });

  const { data: zoomConfigured = false } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/admin/zoom/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/zoom/status");
      return res.ok ? res.json() : { configured: false };
    },
    enabled: !!id,
  });

  const createZoomMeetingMutation = useMutation({
    mutationFn: async (payload: { topic: string; startTime: string; durationMinutes: number; agenda?: string }) => {
      const res = await apiRequest("POST", "/api/admin/zoom/create-meeting", {
        ...payload,
        contactId: id,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create meeting");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setScheduleTopic("");
      setScheduleDate("");
      setScheduleTime("14:00");
      setScheduleAgenda("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id, "timeline"] });
      toast({
        title: "Meeting scheduled",
        description: "Use Start meeting (host) or share the Join link with the lead.",
      });
      setCreatedMeetingLinks(data);
    },
    onError: (e: Error) => toast({ title: "Schedule failed", description: e.message, variant: "destructive" }),
  });

  const scanCardMutation = useMutation({
    mutationFn: async (imageDataUrl: string) => {
      const res = await apiRequest("POST", "/api/admin/crm/business-card", {
        image: imageDataUrl,
        contactId: id,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Scan failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
      if (cardInputRef.current) cardInputRef.current.value = "";
      setCardScanning(false);
      toast({ title: "Contact updated from card", description: "Data and card image saved." });
    },
    onError: (e: Error) => {
      setCardScanning(false);
      toast({ title: "Card scan failed", description: e.message, variant: "destructive" });
    },
  });

  const handleCardFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCardScanning(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      scanCardMutation.mutate(dataUrl);
    };
    reader.onerror = () => {
      setCardScanning(false);
      toast({ title: "Could not read image", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (contact === null || (contact && !contact.id)) router.push("/admin/crm");
  }, [contact, router]);

  if (contactLoading || !contact) {
    return (
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const timeline = timelineData?.timeline ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Link>
          </Button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={contact.status ?? "new"}
            onValueChange={(v) => updateStatusMutation.mutate(v)}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => enrichMutation.mutate()}
            disabled={enrichMutation.isPending}
          >
            {enrichMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Enrich contact
          </Button>
          <input
            ref={cardInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-label="Scan business card"
            onChange={handleCardFile}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => cardInputRef.current?.click()}
            disabled={cardScanning || scanCardMutation.isPending}
          >
            {cardScanning || scanCardMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Scan business card
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/crm/discovery?contactId=${id}`}>
              <Video className="h-4 w-4 mr-2" />
              Discovery workspace
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/crm/proposal-prep?contactId=${id}`}>
              <FileText className="h-4 w-4 mr-2" />
              Proposal prep
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/admin/email-hub/compose?contactId=${id}`}>
              <Mail className="h-4 w-4 mr-2" />
              Email Hub
            </Link>
          </Button>
        </div>
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
                {insights?.contactCompleteness && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Profile</p>
                    <div className="text-sm font-medium">
                      <Badge variant={insights.contactCompleteness.label === "complete" ? "default" : insights.contactCompleteness.label === "good" ? "secondary" : "outline"}>
                        {insights.contactCompleteness.score}% {insights.contactCompleteness.label}
                      </Badge>
                    </div>
                  </div>
                )}
                {contact.leadScore != null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Lead score</p>
                    <p className="text-xl font-semibold">{contact.leadScore}</p>
                  </div>
                )}
                {insights?.aiFitScore != null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">AI fit</p>
                    <p className="text-xl font-semibold">{insights.aiFitScore}</p>
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
            {contact.afnCommunity && (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  Ascendra Founder Network (matched by email)
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  {contact.afnCommunity.founderTribeLabel && (
                    <span>
                      <span className="text-foreground font-medium">Community type: </span>
                      {contact.afnCommunity.founderTribeLabel}
                    </span>
                  )}
                  {contact.afnCommunity.headline && (
                    <span className="min-w-0 max-w-full">{contact.afnCommunity.headline}</span>
                  )}
                  <span>
                    Visibility: {contact.afnCommunity.profileVisibility ?? "—"}
                    {contact.afnCommunity.isOnboardingComplete === false && " · profile incomplete"}
                  </span>
                </div>
                {contact.afnCommunity.publicProfilePath && (
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <Link href={contact.afnCommunity.publicProfilePath} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      View public member page
                    </Link>
                  </Button>
                )}
              </div>
            )}
            {(contact.source || contact.industry || contact.jobTitle || contact.linkedinUrl) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
                {contact.source && <span>Source: {contact.source}</span>}
                {contact.industry && <span>Industry: {contact.industry}</span>}
                {contact.jobTitle && <span>Role: {contact.jobTitle}</span>}
                {contact.linkedinUrl && (
                  <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </a>
                )}
                {contact.customFields &&
                  typeof contact.customFields.socialProfiles === "object" &&
                  contact.customFields.socialProfiles !== null &&
                  !Array.isArray(contact.customFields.socialProfiles) &&
                  Object.entries(contact.customFields.socialProfiles as Record<string, string>).filter(
                    ([k, v]) => k !== "linkedin" && typeof v === "string" && v.startsWith("http")
                  ).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline capitalize"
                    >
                      <ExternalLink className="h-3 w-3" /> {platform}
                    </a>
                  ))}
              </div>
            )}
            {(insights?.contactCompleteness?.missingFields?.length ?? 0) > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Missing data</p>
                <p className="text-muted-foreground mt-0.5">Add: {insights!.contactCompleteness.missingFields.join(", ")}</p>
              </div>
            )}
            {insights?.researchCompleteness && insights.researchCompleteness.score < 100 && (insights.researchCompleteness.missingFields?.length ?? 0) > 0 && (
              <div className="rounded-md border border-blue-500/40 bg-blue-500/10 p-3 text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">Research profile incomplete</p>
                <p className="text-muted-foreground mt-0.5">Missing: {insights.researchCompleteness.missingFields.join(", ")}</p>
              </div>
            )}
            {contact.notes && (
              <p className="text-sm border-l-2 border-muted pl-3">{contact.notes}</p>
            )}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Edit contact details</p>
              <p className="text-xs text-muted-foreground">
                Update source, role, company, and other fields. Changes save to this lead only.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="detail-name">Name</Label>
                  <Input
                    id="detail-name"
                    value={detailEdit.name}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="detail-email">Email</Label>
                  <Input
                    id="detail-email"
                    type="email"
                    value={detailEdit.email}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="detail-phone">Phone</Label>
                  <Input
                    id="detail-phone"
                    value={detailEdit.phone}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="detail-company">Company</Label>
                  <Input
                    id="detail-company"
                    value={detailEdit.company}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="detail-job">Job title</Label>
                  <Input
                    id="detail-job"
                    value={detailEdit.jobTitle}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, jobTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="detail-industry">Industry</Label>
                  <Input
                    id="detail-industry"
                    value={detailEdit.industry}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, industry: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="detail-source">Source</Label>
                  <Input
                    id="detail-source"
                    value={detailEdit.source}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, source: e.target.value }))}
                    placeholder="e.g. website, referral, event"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="detail-li">LinkedIn URL</Label>
                  <Input
                    id="detail-li"
                    value={detailEdit.linkedinUrl}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, linkedinUrl: e.target.value }))}
                    placeholder="https://…"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="detail-value">Estimated value (USD)</Label>
                  <Input
                    id="detail-value"
                    inputMode="decimal"
                    value={detailEdit.estimatedValueDollars}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, estimatedValueDollars: e.target.value }))}
                    placeholder="e.g. 10000"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="detail-notes">Notes</Label>
                  <Textarea
                    id="detail-notes"
                    value={detailEdit.notes}
                    onChange={(e) => setDetailEdit((d) => ({ ...d, notes: e.target.value }))}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => updateDetailsMutation.mutate()}
                disabled={
                  updateDetailsMutation.isPending ||
                  !detailEdit.name.trim() ||
                  !detailEdit.email.trim()
                }
              >
                {updateDetailsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save details
              </Button>
            </div>
            {contact.customFields?.businessCardImage && typeof contact.customFields.businessCardImage === "string" ? (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Business card</p>
                <img
                  src={contact.customFields.businessCardImage as string}
                  alt="Saved business card"
                  className="rounded border max-h-40 object-contain bg-muted/30"
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Next best actions & qualification */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Next best actions
              </CardTitle>
              <CardDescription>Prioritized recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {insights?.nextBestActions && insights.nextBestActions.length > 0 ? (
                <ul className="space-y-2 mb-3">
                  {insights.nextBestActions.slice(0, 5).map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Badge variant={a.priority === "high" ? "default" : "secondary"} className="shrink-0 h-5">
                        {a.priority}
                      </Badge>
                      <span><strong>{a.action}</strong>{a.reason ? ` — ${a.reason}` : ""}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  {(() => {
                    const s = contact.status ?? "new";
                    if (s === "new") return "Reach out with a discovery call or intro email.";
                    if (s === "contacted") return "Send proposal or schedule a follow-up call.";
                    if (s === "qualified") return "Create deal and send proposal.";
                    if (s === "proposal") return "Follow up on proposal; address questions.";
                    if (s === "negotiation") return "Close terms and send contract.";
                    if (s === "won") return "Onboard and deliver.";
                    if (s === "lost") return "Log reason; consider re-engagement later.";
                    return "Move to next stage in your pipeline.";
                  })()}
                </p>
              )}
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setActiveTab("tasks")}>
                Open tasks <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Qualification
              </CardTitle>
              <CardDescription>Budget, authority, need, timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Record qualification notes in the Add note tab (e.g. Budget: confirmed, Decision-maker: yes, Timeline: Q2).
              </p>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setActiveTab("notes")}>
                Add note
              </Button>
            </CardContent>
          </Card>
        </div>

        <PinnedPlaybookCard contact={contact} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] })} />

        <SocialProfileDiscoveryCard
          contactId={id}
          contactName={contact.name}
          company={contact.company}
          jobTitle={contact.jobTitle}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
          }}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Revenue ops (Twilio + booking)
            </CardTitle>
            <CardDescription>
              Manual SMS and booking links log to the timeline. Configure templates in{" "}
              <Link href="/admin/growth-os/revenue-ops/settings" className="text-primary underline-offset-2 hover:underline">
                Growth OS → Revenue ops settings
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {contact.bookedCallAt && (
                <Badge variant="secondary">Booked call logged</Badge>
              )}
              {contact.lastContactedAt && (
                <span>Last contact: {formatLocaleMediumDate(contact.lastContactedAt)}</span>
              )}
              {contact.stripeCustomerId && <span>Stripe customer linked</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ops-sms">Quick SMS</Label>
              <Textarea
                id="ops-sms"
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="Short message to the lead’s phone on file…"
                className="min-h-[80px] text-sm"
                disabled={!contact.phone || !!contact.doNotContact}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => sendOpsSmsMutation.mutate()}
                  disabled={!smsBody.trim() || !contact.phone || !!contact.doNotContact || sendOpsSmsMutation.isPending}
                >
                  {sendOpsSmsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send SMS"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => sendBookingLinkMutation.mutate()}
                  disabled={sendBookingLinkMutation.isPending}
                >
                  {sendBookingLinkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send booking link (SMS)"}
                </Button>
              </div>
              {!contact.phone && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Add a phone number on this contact to send SMS.</p>
              )}
              {contact.doNotContact && (
                <p className="text-xs text-muted-foreground">Do not contact is enabled — SMS disabled.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {(contact.source || contact.utmSource || contact.utmMedium || contact.utmCampaign || contact.referringPage || contact.landingPage) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Source & attribution
              </CardTitle>
              <CardDescription>Where this lead came from</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {contact.source && <><dt className="text-muted-foreground">Source</dt><dd>{contact.source}</dd></>}
                {contact.utmSource && <><dt className="text-muted-foreground">UTM source</dt><dd>{contact.utmSource}</dd></>}
                {contact.utmMedium && <><dt className="text-muted-foreground">UTM medium</dt><dd>{contact.utmMedium}</dd></>}
                {contact.utmCampaign && <><dt className="text-muted-foreground">UTM campaign</dt><dd>{contact.utmCampaign}</dd></>}
                {contact.referringPage && <><dt className="text-muted-foreground">Referring page</dt><dd className="truncate" title={contact.referringPage}>{contact.referringPage}</dd></>}
                {contact.landingPage && <><dt className="text-muted-foreground">Landing page</dt><dd className="truncate" title={contact.landingPage}>{contact.landingPage}</dd></>}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Stage 4: Workflow & outreach state */}
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Workflow & outreach
            </CardTitle>
            <CardDescription>
              Automation updates lead status from real events (email/SMS type, forms, deals, AI steps). Override anytime
              with the Status control above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              {contact.outreachState && <Badge variant="secondary">Outreach: {contact.outreachState.replace(/_/g, " ")}</Badge>}
              {contact.nurtureState && <Badge variant="outline">Nurture: {contact.nurtureState.replace(/_/g, " ")}</Badge>}
              {contact.sequenceReady && <Badge variant="default">Sequence ready</Badge>}
              {contact.doNotContact && <Badge variant="destructive">Do not contact</Badge>}
            </div>
            {contact.nextFollowUpAt && (
              <p className="text-muted-foreground">Next follow-up: {formatLocaleMediumDateTime(contact.nextFollowUpAt)}</p>
            )}
            {contact.nurtureReason && <p className="text-muted-foreground">{contact.nurtureReason}</p>}
            {workflowExecutions.length > 0 && (
              <p className="text-muted-foreground pt-1">
                Last automation: {workflowExecutions[0].workflowKey} ({workflowExecutions[0].status}) — {workflowExecutions[0].startedAt ? formatLocaleMediumDate(workflowExecutions[0].startedAt) : ""}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stage 3: AI Guidance */}
        <Card className="border-primary/20 bg-muted/30">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Guidance
                </CardTitle>
                <CardDescription>
                  {guidanceData?.guidance && Object.keys(guidanceData.guidance).length > 0
                    ? `Generated ${Object.keys(guidanceData.guidance).length} outputs · ${guidanceData.guidance.lead_summary?.providerType ?? "rule"}-based`
                    : "Generate summaries, next actions, discovery questions, and proposal prep from CRM data."}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateGuidanceMutation.mutate()}
                disabled={generateGuidanceMutation.isPending}
              >
                {generateGuidanceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {guidanceData?.guidance && Object.keys(guidanceData.guidance).length > 0 ? "Refresh guidance" : "Generate guidance"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {guidanceData?.guidance && Object.keys(guidanceData.guidance).length > 0 ? (
              <>
                {guidanceData.guidance.lead_summary && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Lead summary
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm space-y-2">
                        <p>{(guidanceData.guidance.lead_summary.content as { shortSummary?: string }).shortSummary}</p>
                        <p className="text-muted-foreground">{(guidanceData.guidance.lead_summary.content as { whyThisLeadMatters?: string }).whyThisLeadMatters}</p>
                        {((guidanceData.guidance.lead_summary.content as { suggestedNext3Actions?: string[] }).suggestedNext3Actions?.length ?? 0) > 0 && (
                          <ul className="list-disc pl-4">
                            {(guidanceData.guidance.lead_summary.content as { suggestedNext3Actions?: string[] }).suggestedNext3Actions?.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        )}
                        <p className="text-xs text-muted-foreground">{guidanceData.guidance.lead_summary.generatedAt ? formatLocaleMediumDateTime(guidanceData.guidance.lead_summary.generatedAt) : ""} · {guidanceData.guidance.lead_summary.providerType}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {guidanceData.guidance.opportunity_assessment && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Opportunity assessment
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm space-y-2">
                        <p>{(guidanceData.guidance.opportunity_assessment.content as { summary?: string }).summary}</p>
                        {((guidanceData.guidance.opportunity_assessment.content as { strengthSignals?: string[] }).strengthSignals?.length ?? 0) > 0 && (
                          <p><strong>Signals:</strong> {(guidanceData.guidance.opportunity_assessment.content as { strengthSignals?: string[] }).strengthSignals?.join("; ")}</p>
                        )}
                        {((guidanceData.guidance.opportunity_assessment.content as { risks?: string[] }).risks?.length ?? 0) > 0 && (
                          <p className="text-amber-700 dark:text-amber-400"><strong>Risks:</strong> {(guidanceData.guidance.opportunity_assessment.content as { risks?: string[] }).risks?.join("; ")}</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {guidanceData.guidance.qualification_gaps && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Qualification gaps
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm">
                        <p>Completeness: {(guidanceData.guidance.qualification_gaps.content as { overallCompletenessScore?: number }).overallCompletenessScore ?? 0}%</p>
                        {((guidanceData.guidance.qualification_gaps.content as { missingFields?: string[] }).missingFields?.length ?? 0) > 0 && (
                          <p className="text-muted-foreground">Missing: {(guidanceData.guidance.qualification_gaps.content as { missingFields?: string[] }).missingFields?.join(", ")}</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {guidanceData.guidance.next_best_actions && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Next best actions
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm space-y-2">
                        {((guidanceData.guidance.next_best_actions.content as { actions?: Array<{ id: string; label: string; reason: string; priority: string }> }).actions ?? []).map((a) => (
                          <div key={a.id} className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-medium">{a.label}</span>
                              {a.reason && <span className="text-muted-foreground"> — {a.reason}</span>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => acceptRecommendationMutation.mutate({ label: a.label, reason: a.reason })}
                                disabled={acceptRecommendationMutation.isPending}
                              >
                                Add task
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {guidanceData.guidance.discovery_questions && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Discovery questions
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm space-y-2">
                        {((guidanceData.guidance.discovery_questions.content as { topQuestions?: string[] }).topQuestions ?? []).map((q, i) => (
                          <p key={i}>· {q}</p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {guidanceData.guidance.proposal_prep && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Proposal prep notes
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm space-y-2">
                        <p><strong>Offer direction:</strong> {(guidanceData.guidance.proposal_prep.content as { likelyOfferDirection?: string }).likelyOfferDirection}</p>
                        {((guidanceData.guidance.proposal_prep.content as { assumptionsRequiringValidation?: string[] }).assumptionsRequiringValidation?.length ?? 0) > 0 && (
                          <p className="text-muted-foreground">Validate: {(guidanceData.guidance.proposal_prep.content as { assumptionsRequiringValidation?: string[] }).assumptionsRequiringValidation?.join(", ")}</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {guidanceData.guidance.risk_warnings && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between font-medium">
                        Risk warnings
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="rounded-md border bg-background p-3 text-sm">
                        {((guidanceData.guidance.risk_warnings.content as { warnings?: Array<{ label: string; severity: string }> }).warnings ?? []).map((w, i) => (
                          <p key={i} className={w.severity === "high" ? "text-amber-700 dark:text-amber-400" : ""}>· {w.label}</p>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Click &quot;Generate guidance&quot; to build lead summary, next actions, discovery questions, and proposal prep from current CRM data.</p>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-nowrap overflow-x-auto overflow-y-hidden gap-1 p-1.5 min-h-[44px] rounded-lg [&>button]:shrink-0 [&>button]:min-h-[40px]">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="tasks" id="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="notes">Note</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Activity timeline</CardTitle>
                <CardDescription>Form submissions, emails, meetings, document views, and site visits</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {timeline.map((item) => (
                      <li key={item.id} className="flex gap-3 border-l-2 border-muted pl-4 py-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-sm">{item.title}</p>
                            {item.metadata?.startUrl && (
                              <Button size="sm" className="h-7 text-xs gap-1" asChild>
                                <a href={item.metadata.startUrl} target="_blank" rel="noopener noreferrer">
                                  <Video className="h-3 w-3" /> Start meeting
                                </a>
                              </Button>
                            )}
                            {item.metadata?.meetingUrl && (
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                                <a href={item.metadata.meetingUrl} target="_blank" rel="noopener noreferrer">
                                  Join Zoom
                                </a>
                              </Button>
                            )}
                          </div>
                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                          {item.metadata?.body && item.metadata.activityType === "meeting" && (
                            <div className="mt-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground whitespace-pre-wrap">{item.metadata.body}</div>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">{formatLocaleMediumDateTime(item.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="meetings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Video className="h-4 w-4" /> Zoom meetings</CardTitle>
                <CardDescription>Schedule or log Zoom meetings and conversation notes for this lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {zoomConfigured && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4">
                    <h4 className="text-sm font-medium">Schedule with Zoom</h4>
                    <p className="text-xs text-muted-foreground">Create a scheduled meeting and add it to this lead. You can start the meeting from here or share the join link.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Meeting topic</Label>
                        <Input
                          placeholder="e.g. Discovery call with {contact.name}"
                          value={scheduleTopic}
                          onChange={(e) => setScheduleTopic(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="mt-1"
                          min={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Time</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duration (minutes)</Label>
                        <Select
                          value={String(scheduleDuration)}
                          onValueChange={(v) => setScheduleDuration(Number(v))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[30, 45, 60, 90, 120].map((m) => (
                              <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Agenda (optional)</Label>
                        <Textarea
                          placeholder="Meeting agenda or notes..."
                          value={scheduleAgenda}
                          onChange={(e) => setScheduleAgenda(e.target.value)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            const date = scheduleDate || new Date().toISOString().slice(0, 10);
                            const startTime = new Date(`${date}T${scheduleTime}`).toISOString();
                            createZoomMeetingMutation.mutate({
                              topic: scheduleTopic.trim() || `Call with ${contact.name}`,
                              startTime,
                              durationMinutes: scheduleDuration,
                              agenda: scheduleAgenda.trim() || undefined,
                            });
                          }}
                          disabled={!scheduleDate || createZoomMeetingMutation.isPending}
                        >
                          {createZoomMeetingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Schedule meeting
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCreatedMeetingLinks(null)}>
                          Dismiss links
                        </Button>
                      </div>
                    </div>
                    {createdMeetingLinks && (
                      <div className="rounded-md border bg-background p-3 space-y-2">
                        <p className="text-sm font-medium">Meeting created — use these links:</p>
                        <div className="flex flex-wrap gap-2">
                          {createdMeetingLinks.startUrl && (
                            <Button size="sm" className="gap-1" asChild>
                              <a href={createdMeetingLinks.startUrl} target="_blank" rel="noopener noreferrer">
                                <Video className="h-3 w-3" /> Start meeting (host)
                              </a>
                            </Button>
                          )}
                          {createdMeetingLinks.joinUrl && (
                            <Button variant="outline" size="sm" className="gap-1" asChild>
                              <a href={createdMeetingLinks.joinUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" /> Join link (share with lead)
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <h4 className="text-sm font-medium">Log a Zoom meeting</h4>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">Meeting title</Label>
                      <Input
                        placeholder="e.g. Discovery call, Follow-up"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zoom meeting link</Label>
                      <Input
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Conversation notes</Label>
                      <Textarea
                        placeholder="Key points, next steps, objections, timeline..."
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={() => addMeetingMutation.mutate({
                        subject: meetingTitle.trim() || "Zoom meeting",
                        body: meetingNotes.trim() || "",
                        meetingUrl: meetingUrl.trim(),
                      })}
                      disabled={!meetingUrl.trim() || addMeetingMutation.isPending}
                    >
                      {addMeetingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Log meeting
                    </Button>
                  </div>
                </div>
                {(() => {
                  const meetings = timeline.filter((i) => i.metadata?.activityType === "meeting");
                  if (meetings.length === 0) return <p className="text-sm text-muted-foreground">No meetings logged yet.</p>;
                  return (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Past meetings</h4>
                      <ul className="space-y-3">
                        {meetings.map((item) => (
                          <li key={item.id} className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-medium text-sm">{item.title}</span>
                              <span className="text-xs text-muted-foreground">{formatLocaleMediumDateTime(item.createdAt)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.metadata?.startUrl && (
                                <Button size="sm" className="gap-1" asChild>
                                  <a href={item.metadata.startUrl} target="_blank" rel="noopener noreferrer">
                                    <Video className="h-3 w-3" /> Start meeting
                                  </a>
                                </Button>
                              )}
                              {item.metadata?.meetingUrl && (
                                <Button variant="outline" size="sm" className="gap-1" asChild>
                                  <a href={item.metadata.meetingUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" /> Join link
                                  </a>
                                </Button>
                              )}
                            </div>
                            {item.metadata?.body && (
                              <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap border-t pt-2">{item.metadata.body}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
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
                            {t.dueAt && ` · Due ${formatLocaleMediumDate(t.dueAt)}`}
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
                            First: {formatLocaleMediumDateTime(e.firstViewedAt)} · Last: {formatLocaleMediumDateTime(e.lastViewedAt)}
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
                    {commEvents.map((e) => {
                      const meta = e.metadata as { commCampaignName?: string; subject?: string; url?: string } | null | undefined;
                      const label =
                        meta?.commCampaignName ?
                          `${e.eventType} · ${meta.commCampaignName}`
                        : e.eventType;
                      return (
                        <li key={e.id} className="flex flex-col gap-0.5 text-sm py-2 border-b last:border-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="capitalize font-medium">{label}</span>
                            <span className="text-muted-foreground text-xs">{formatLocaleMediumDateTime(e.createdAt)}</span>
                          </div>
                          {meta?.subject && <span className="text-xs text-muted-foreground truncate">{meta.subject}</span>}
                          {meta?.url && (
                            <span className="text-xs text-primary truncate max-w-full" title={meta.url}>
                              {meta.url}
                            </span>
                          )}
                          {e.emailId && !meta?.commCampaignName && (
                            <span className="text-xs text-muted-foreground">{e.emailId}</span>
                          )}
                        </li>
                      );
                    })}
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
    </div>
  );
}
