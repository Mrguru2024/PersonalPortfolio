"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  FileText,
  DollarSign,
  ExternalLink,
  Calendar,
  MessageSquare,
  Send,
  Lightbulb,
  Megaphone,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invoice {
  id: number;
  invoiceNumber: string;
  title: string;
  amount: number;
  status: string;
  dueDate: string | null;
  hostInvoiceUrl: string | null;
  createdAt: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

interface FeedbackItem {
  id: number;
  subject: string;
  message: string;
  category: string;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export default function ClientDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("general");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/client/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/invoices");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/client/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/announcements");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: feedbackList = [], isLoading: feedbackLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/client/feedback"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/feedback");
      return res.json();
    },
    enabled: !!user,
  });

  const feedbackMutation = useMutation({
    mutationFn: async (body: { subject: string; message: string; category: string }) => {
      const res = await apiRequest("POST", "/api/client/feedback", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/feedback"] });
      toast({ title: "Feedback sent", description: "Thank you! We'll review it soon." });
      setFeedbackSubject("");
      setFeedbackMessage("");
      setFeedbackCategory("general");
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(
      cents / 100
    );

  const pendingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const typeColors: Record<string, string> = {
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    update: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    success: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
          Your dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View invoices, project updates, and send feedback
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:max-w-md grid grid-cols-3 h-11 sm:h-12 p-1 bg-muted/50 rounded-lg [&>button]:text-xs sm:[&>button]:text-sm [&>button]:px-2 sm:[&>button]:px-3 [&>button[data-state=active]]:bg-emerald-600 [&>button[data-state=active]]:text-white">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm font-medium flex items-center gap-2 shrink-0">
                  <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                  Pending invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                {invoicesLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{pendingInvoices.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingInvoices.length === 0
                        ? "You're all caught up"
                        : "Invoices awaiting payment"}
                    </p>
                    {pendingInvoices.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setActiveTab("invoices")}
                      >
                        View & pay
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm font-medium flex items-center gap-2 shrink-0">
                  <Megaphone className="h-4 w-4 text-blue-500 shrink-0" />
                  Project updates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                {announcementsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{announcements.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Latest news and updates
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project updates list on overview */}
          <Card className="overflow-hidden">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Megaphone className="h-5 w-5 text-emerald-500 shrink-0" />
                Recent project updates
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Announcements and progress from your project</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pt-0">
              {announcementsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8 rounded-xl border-2 border-dashed border-muted">
                  <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
                  <p className="text-sm text-muted-foreground">No updates yet</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {announcements.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-3 sm:p-4 ${typeColors[a.type] ?? typeColors.info}`}
                    >
                      <p className="font-semibold text-sm sm:text-base truncate sm:whitespace-normal">{a.title}</p>
                      <p className="text-xs sm:text-sm mt-1 opacity-90 whitespace-pre-wrap break-words">{a.content}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {format(new Date(a.createdAt), "PPP")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4 sm:space-y-6 mt-4">
          <Card className="border-2 border-emerald-500/20 overflow-hidden">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                Your invoices
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">View and pay pending invoices</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pt-0">
              {invoicesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5">
                  <FileText className="h-12 w-12 mx-auto text-emerald-500/60 mb-4" />
                  <p className="text-muted-foreground font-medium">No invoices</p>
                  <p className="text-sm text-muted-foreground mt-1">You don't have any invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-xl border bg-card p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base truncate">{inv.title}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{inv.invoiceNumber}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                          <Badge
                            variant={
                              inv.status === "paid"
                                ? "default"
                                : inv.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="shrink-0"
                          >
                            {inv.status === "paid" && <CheckCircle className="h-3 w-3 mr-1 shrink-0" />}
                            {inv.status === "sent" && <Clock className="h-3 w-3 mr-1 shrink-0" />}
                            {inv.status}
                          </Badge>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-sm sm:text-base">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            {formatCurrency(inv.amount)}
                          </span>
                          {inv.dueDate && (
                            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                              Due {format(new Date(inv.dueDate), "PPP")}
                            </span>
                          )}
                        </div>
                      </div>
                      {(inv.status === "sent" || inv.status === "overdue") && inv.hostInvoiceUrl && (
                        <Button asChild className="w-full sm:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700">
                          <a href={inv.hostInvoiceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                            Pay invoice
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4 sm:space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-2 border-amber-500/20 overflow-hidden">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                  Send feedback or ideas
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Share feedback, feature ideas, or questions about your project
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pt-0 space-y-4">
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Brief subject"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={feedbackCategory} onValueChange={setFeedbackCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Your feedback or ideas..."
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 shrink-0"
                  onClick={() =>
                    feedbackMutation.mutate({
                      subject: feedbackSubject,
                      message: feedbackMessage,
                      category: feedbackCategory,
                    })
                  }
                  disabled={
                    feedbackMutation.isPending ||
                    !feedbackSubject.trim() ||
                    feedbackMessage.trim().length < 10
                  }
                >
                  {feedbackMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send feedback
                </Button>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
                  Your feedback history
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Previous submissions and responses</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pt-0">
                {feedbackLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border-2 border-dashed border-muted">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
                    <p className="text-sm text-muted-foreground">No feedback sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-[320px] sm:max-h-[400px] overflow-y-auto pr-1">
                    {feedbackList.map((f) => (
                      <div
                        key={f.id}
                        className="rounded-lg border p-3 sm:p-4 bg-muted/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <p className="font-medium text-sm sm:text-base truncate">{f.subject}</p>
                          <Badge variant="outline" className="text-xs shrink-0 w-fit">
                            {f.category}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words line-clamp-2 sm:line-clamp-none">{f.message}</p>
                        {f.adminResponse && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                            <p className="text-sm">{f.adminResponse}</p>
                            {f.respondedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(f.respondedAt), "PPP")}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(f.createdAt), "PPP")} · {f.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
