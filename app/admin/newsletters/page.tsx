"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Mail, Eye, Trash2, Send, Edit, ArrowLeft, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { matchesLiveSearch } from "@/lib/matchesLiveSearch";

interface Newsletter {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}

function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    scheduled: "secondary",
    sending: "secondary",
    sent: "default",
    failed: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default function NewslettersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Force refresh user data to ensure we have the latest adminApproved status
  useEffect(() => {
    if (user && user.isAdmin) {
      // Invalidate user query to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  }, [user?.isAdmin, queryClient]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: newsletters = [], isLoading, error } = useQuery<Newsletter[]>({
    queryKey: ["/api/admin/newsletters"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/newsletters");
        if (!response.ok) {
          if (response.status === 403) {
            const data = await response.json().catch(() => ({}));
            const msg = data?.message || "Admin access required";
            toast({
              title: "Access denied",
              description: msg,
              variant: "destructive",
            });
            return [];
          }
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch newsletters" }));
          throw new Error(errorData.message || "Failed to fetch newsletters");
        }
        return await response.json();
      } catch (err: any) {
        const errorMessage = err?.message || "";
        if (errorMessage.includes("Admin access required") || errorMessage.includes("403")) {
          toast({
            title: "Access denied",
            description: errorMessage,
            variant: "destructive",
          });
          return [];
        }
        throw err;
      }
    },
    enabled: !authLoading && !!user && user.isAdmin === true && user.adminApproved === true,
    retry: false,
    throwOnError: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/newsletters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters"] });
      toast({
        title: "Success",
        description: "Newsletter deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete newsletter",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/newsletters/${id}/send`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletters"] });
      toast({
        title: "Newsletter Sent",
        description: `Sent to ${data.sent} subscribers. ${data.failed > 0 ? `${data.failed} failed.` : ""}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter",
        variant: "destructive",
      });
    },
  });

  const filteredNewsletters = useMemo(() => {
    return newsletters.filter((n) => {
      const okStatus = statusFilter === "all" || n.status === statusFilter;
      const okSearch = matchesLiveSearch(listSearch, [
        n.subject,
        n.status,
        String(n.id),
        n.totalRecipients != null ? String(n.totalRecipients) : "",
      ]);
      return okStatus && okSearch;
    });
  }, [newsletters, listSearch, statusFilter]);

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
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load newsletters</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please ensure you have admin approval and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Newsletters</h1>
            <p className="text-muted-foreground">
              Create and manage email campaigns
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/newsletters/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Newsletter
            </Link>
          </Button>
        </div>
      </div>

      {newsletters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No newsletters yet</p>
            <Button asChild>
              <Link href="/admin/newsletters/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Newsletter
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Filter by subject or status as you type…"
                className="pl-9"
                aria-label="Filter newsletters"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by campaign status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredNewsletters.length} of {newsletters.length} campaigns
          </p>
        {filteredNewsletters.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No campaigns match your filter. Try different words or set status to “All statuses”.
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-4">
          {filteredNewsletters.map((newsletter) => (
            <Card key={newsletter.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{newsletter.subject}</CardTitle>
                      {getStatusBadge(newsletter.status)}
                    </div>
                    <CardDescription>
                      Created {format(new Date(newsletter.createdAt), "PPp")}
                      {newsletter.sentAt && (
                        <> • Sent {format(new Date(newsletter.sentAt), "PPp")}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/newsletters/${newsletter.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    {newsletter.status === "draft" && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/newsletters/${newsletter.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => sendMutation.mutate(newsletter.id)}
                          disabled={sendMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(newsletter.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {newsletter.status === "sent" && (
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Recipients: {newsletter.totalRecipients}</span>
                    <span>Sent: {newsletter.sentCount}</span>
                    {newsletter.failedCount > 0 && (
                      <span className="text-destructive">Failed: {newsletter.failedCount}</span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        )}
        </>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Newsletter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this newsletter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
