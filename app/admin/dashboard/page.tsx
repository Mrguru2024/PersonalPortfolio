"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, FileText, MessageSquare, FileCheck, CheckCircle, XCircle, Clock, Archive } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  createdAt: string;
}

interface ResumeRequest {
  id: number;
  name: string;
  email: string;
  company?: string;
  position?: string;
  message?: string;
  accessed: boolean;
  accessedAt?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch assessments
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/admin/assessments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assessments");
      return await response.json();
    },
    enabled: !!user?.isAdmin,
  });

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/admin/contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/contacts");
      return await response.json();
    },
    enabled: !!user?.isAdmin,
  });

  // Fetch resume requests
  const { data: resumeRequests = [], isLoading: resumeLoading } = useQuery<ResumeRequest[]>({
    queryKey: ["/api/admin/resume-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/resume-requests");
      return await response.json();
    },
    enabled: !!user?.isAdmin,
  });

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

  const getTotalPrice = (pricingBreakdown: any) => {
    if (!pricingBreakdown) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(pricingBreakdown.total || 0);
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
  const pendingContacts = contacts.length; // All contacts are considered pending for review

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage assessments, quotes, and responses
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingAssessments} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotes/Contacts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              Contact form submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resume Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumeRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {resumeRequests.filter((r) => !r.accessed).length} unaccessed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assessments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">
            Assessments ({assessments.length})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Quotes/Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="resume-requests">
            Resume Requests ({resumeRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          {assessmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : assessments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No assessments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{assessment.name}</CardTitle>
                        <CardDescription>
                          {assessment.email} {assessment.phone && `• ${assessment.phone}`}
                        </CardDescription>
                        {assessment.company && (
                          <CardDescription>{assessment.company}</CardDescription>
                        )}
                      </div>
                      {getStatusBadge(assessment.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Project:</p>
                        <p className="text-sm text-muted-foreground">
                          {assessment.assessmentData?.projectName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Estimated Price:</p>
                        <p className="text-sm font-semibold">
                          {getTotalPrice(assessment.pricingBreakdown)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={assessment.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: assessment.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAssessment(assessment)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/assessment/results?id=${assessment.id}`)
                          }
                        >
                          View Results
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(assessment.createdAt), "PPp")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          {contactsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No contacts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        <CardDescription>{contact.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Subject:</p>
                        <p className="text-sm text-muted-foreground">{contact.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Message:</p>
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
                        Submitted: {contact.createdAt ? format(new Date(contact.createdAt), "PPp") : "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resume Requests Tab */}
        <TabsContent value="resume-requests" className="space-y-4">
          {resumeLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : resumeRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No resume requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resumeRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.name}</CardTitle>
                        <CardDescription>{request.email}</CardDescription>
                        {request.company && (
                          <CardDescription>{request.company}</CardDescription>
                        )}
                      </div>
                      {request.accessed ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Accessed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {request.position && (
                        <div>
                          <p className="text-sm font-medium">Position:</p>
                          <p className="text-sm text-muted-foreground">{request.position}</p>
                        </div>
                      )}
                      {request.message && (
                        <div>
                          <p className="text-sm font-medium">Message:</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {request.message}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Requested: {format(new Date(request.createdAt), "PPp")}
                        {request.accessedAt &&
                          ` • Accessed: ${format(new Date(request.accessedAt), "PPp")}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assessment Detail Dialog */}
      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
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
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {JSON.stringify(selectedAssessment.assessmentData, null, 2)}
                </pre>
              </div>
              {selectedAssessment.pricingBreakdown && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Pricing Breakdown</h4>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                      {JSON.stringify(selectedAssessment.pricingBreakdown, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Detail Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>
              Full message from {selectedContact?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <p>Name: {selectedContact.name}</p>
                <p>Email: {selectedContact.email}</p>
                <p>Subject: {selectedContact.subject}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Message</h4>
                <p className="whitespace-pre-wrap">{selectedContact.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
