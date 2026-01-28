"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, CheckCircle, Clock, AlertCircle, ArrowLeft, Reply } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Feedback {
  id: number;
  userId: number;
  subject: string;
  message: string;
  category: string;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: feedback = [], isLoading, error } = useQuery<Feedback[]>({
    queryKey: ["/api/admin/feedback"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/feedback");
        if (!response.ok) {
          if (response.status === 403) {
            return [];
          }
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch feedback" }));
          throw new Error(errorData.message || "Failed to fetch feedback");
        }
        return await response.json();
      } catch (err: any) {
        const errorMessage = err?.message || "";
        if (errorMessage.includes("Admin access required") || 
            errorMessage.includes("403")) {
          return [];
        }
        throw err;
      }
    },
    enabled: !authLoading && !!user && user.isAdmin === true && user.adminApproved === true,
    retry: false,
    throwOnError: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; adminResponse?: string; status?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/feedback/${data.id}`, {
        adminResponse: data.adminResponse,
        status: data.status,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback updated",
        description: "Feedback has been updated successfully",
      });
      setSelectedFeedback(null);
      setAdminResponse("");
      setStatus("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feedback",
        variant: "destructive",
      });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "outline",
      read: "secondary",
      responded: "default",
      resolved: "default",
      archived: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      quote: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      project: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      invoice: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      support: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return (
      <Badge className={colors[category] || colors.general}>
        {category}
      </Badge>
    );
  };

  const filteredFeedback = selectedFeedback
    ? feedback.filter((f) => f.id === selectedFeedback.id)
    : feedback;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-4xl font-bold mb-2">Client Feedback Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and respond to client feedback
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Feedback</CardTitle>
              <CardDescription>{feedback.length} total feedback items</CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No feedback yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredFeedback.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedFeedback?.id === item.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                      onClick={() => {
                        setSelectedFeedback(item);
                        setAdminResponse(item.adminResponse || "");
                        setStatus(item.status);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{item.subject}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoryBadge(item.category)}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.message}
                      </p>
                      {item.adminResponse && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response:</p>
                          <p className="text-sm">{item.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feedback Details & Response */}
        <div className="lg:col-span-1">
          {selectedFeedback ? (
            <Card>
              <CardHeader>
                <CardTitle>Feedback Details</CardTitle>
                <CardDescription>Respond to this feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <p className="text-sm font-medium mt-1">{selectedFeedback.subject}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="mt-1">{getCategoryBadge(selectedFeedback.category)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {selectedFeedback.message}
                  </p>
                </div>
                <div>
                  <Label htmlFor="admin-response">Admin Response</Label>
                  <Textarea
                    id="admin-response"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFeedback(null);
                      setAdminResponse("");
                      setStatus("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      updateMutation.mutate({
                        id: selectedFeedback.id,
                        adminResponse: adminResponse || undefined,
                        status: status,
                      });
                    }}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Reply className="h-4 w-4 mr-2" />
                        Save Response
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Select a feedback item to view details and respond
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
