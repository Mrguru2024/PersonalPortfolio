"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, MessageSquare, FileCheck, CheckCircle, Clock, Archive, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ResumeRequest {
  id: number;
  name: string;
  email: string;
  company?: string;
  purpose?: string;
  position?: string;
  message?: string;
  accessed: boolean;
  accessedAt?: string;
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

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const handled403 = useRef(false);

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

  // Fetch assessments
  const { data: assessments = [], isLoading: assessmentsLoading, error: assessmentsError } = useQuery<Assessment[]>({
    queryKey: ["/api/admin/assessments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assessments");
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    retry: (failureCount, error: Error) => {
      const msg = String(error?.message ?? "");
      if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Admin access required")) return false;
      return failureCount < 1;
    },
  });

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

  // Fetch resume requests
  const { data: resumeRequests = [], isLoading: resumeLoading, error: resumeError } = useQuery<ResumeRequest[]>({
    queryKey: ["/api/admin/resume-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/resume-requests");
      return await response.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
    retry: (failureCount, error: Error) => {
      const msg = String(error?.message ?? "");
      if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Admin access required")) return false;
      return failureCount < 1;
    },
  });

  // Handle 403 from any admin query (onError was removed in TanStack Query v5)
  useEffect(() => {
    const err = assessmentsError ?? contactsError ?? resumeError;
    if (!err) return;
    const msg = String(err?.message ?? "");
    if (msg.includes("403") || msg.includes("Forbidden") || msg.includes("Admin access required")) {
      handleAdmin403(msg);
    }
  }, [assessmentsError, contactsError, resumeError]);

  // Update assessment status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/assessments/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assessments"] });
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

  const getTotalPrice = (pricingBreakdown: any) => {
    if (!pricingBreakdown) return "N/A";
    const total =
      pricingBreakdown.total ??
      pricingBreakdown.estimatedRange?.average ??
      pricingBreakdown.subtotal ??
      pricingBreakdown.basePrice ??
      0;
    return formatCurrency(total);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  const pendingAssessments = assessments.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage assessments, quotes, and responses
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
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

        <Card className="border bg-card shadow-sm sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium">Resume Requests</CardTitle>
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{resumeRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resumeRequests.filter((r) => !r.accessed).length} unaccessed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/admin/invoices">
            <Receipt className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Invoices</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/admin/announcements">
            <span className="truncate">Project updates</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link href="/admin/feedback">
            <span className="truncate">Feedback</span>
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex h-10 sm:h-10 overflow-x-auto overflow-y-hidden gap-0.5 p-1 bg-muted/80 rounded-lg [&>button]:shrink-0 [&>button]:text-xs sm:[&>button]:text-sm [&>button]:px-3 [&>button]:py-2">
          <TabsTrigger value="assessments">
            Assessments ({assessments.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="resume-requests">
            Resume ({resumeRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4 mt-4">
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
            <div className="space-y-4">
              {assessments.map((assessment) => (
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
                        {assessment.assessmentData?.projectName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated Price</p>
                      <p className="text-sm font-semibold">{getTotalPrice(assessment.pricingBreakdown)}</p>
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
                        <Button variant="outline" size="sm" onClick={() => setSelectedAssessment(assessment)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/assessment/results?id=${assessment.id}`)}>
                          View Results
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {format(new Date(assessment.createdAt), "PPp")}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
                      <p className="text-xs text-muted-foreground">
                        Submitted:{" "}
                        {contact.createdAt
                          ? format(new Date(contact.createdAt), "PPp")
                          : "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Resume Requests Tab */}
        <TabsContent value="resume-requests" className="space-y-4 mt-4">
          {resumeLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : resumeRequests.length === 0 ? (
            <Card className="overflow-hidden">
              <CardContent className="py-12 px-4 sm:px-6 text-center">
                <p className="text-sm text-muted-foreground">No resume requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resumeRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="px-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{request.name}</CardTitle>
                        <CardDescription className="break-all">{request.email}</CardDescription>
                        {request.company && (
                          <CardDescription className="truncate">{request.company}</CardDescription>
                        )}
                      </div>
                      {request.accessed ? (
                        <Badge variant="default" className="flex items-center gap-1 shrink-0">
                          <CheckCircle className="h-3 w-3" />
                          Accessed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pt-0 space-y-3">
                    {request.position && (
                      <div>
                        <p className="text-sm font-medium">Position</p>
                        <p className="text-sm text-muted-foreground">{request.position}</p>
                      </div>
                    )}
                    {request.message && (
                      <div>
                        <p className="text-sm font-medium">Message</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{request.message}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested: {format(new Date(request.createdAt), "PPp")}
                      {request.accessedAt && ` • Accessed: ${format(new Date(request.accessedAt), "PPp")}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assessment Detail Dialog */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assessment Details</DialogTitle>
            <DialogDescription>
              Full assessment information for {selectedAssessment?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
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
