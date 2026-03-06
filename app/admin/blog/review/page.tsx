"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BlogContribution {
  id: number;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  authorName: string;
  authorEmail: string;
  createdAt: string;
  isReviewed: boolean;
  isApproved: boolean;
  reviewNotes?: string | null;
}

interface AdminUser {
  id: number;
  username: string;
  email?: string | null;
  role: string;
  isAdmin: boolean;
  adminApproved: boolean;
}

export default function BlogReviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: pendingContributions = [], isLoading: loadingContributions } = useQuery<
    BlogContribution[]
  >({
    queryKey: ["/api/admin/blog/contributions", "pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/blog/contributions?status=pending");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const pendingDeveloperRequests = users.filter(
    (candidate) =>
      candidate.isAdmin !== true &&
      candidate.role === "developer" &&
      candidate.adminApproved !== true
  );

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
    }: {
      id: number;
      decision: "approve" | "reject";
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/blog/contributions/${id}/review`,
        { decision }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/blog/contributions", "pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
    },
  });

  const developerApprovalMutation = useMutation({
    mutationFn: async ({
      userId,
      approved,
    }: {
      userId: number;
      approved: boolean;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${userId}/developer-approval`,
        { approved }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  if (authLoading || !user || !user.isAdmin || !user.adminApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Blog Submission Review</h1>
          <p className="text-sm text-muted-foreground">
            Approve developer accounts and publish approved contributor submissions.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to editor
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Developer Access Requests
            </CardTitle>
            <CardDescription>
              Only approved developer accounts can submit posts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : pendingDeveloperRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending developer access requests.
              </p>
            ) : (
              pendingDeveloperRequests.map((candidate) => (
                <div key={candidate.id} className="rounded-md border p-3">
                  <p className="font-medium">{candidate.username}</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {candidate.email || "No email on file"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        developerApprovalMutation.mutate({
                          userId: candidate.id,
                          approved: true,
                        })
                      }
                    >
                      Approve developer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        developerApprovalMutation.mutate({
                          userId: candidate.id,
                          approved: false,
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Blog Submissions</CardTitle>
            <CardDescription>
              Admin approval publishes the post immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingContributions ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : pendingContributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending blog submissions.
              </p>
            ) : (
              pendingContributions.map((contribution) => (
                <div key={contribution.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{contribution.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {contribution.authorName} · {contribution.authorEmail}
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {contribution.summary}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted {format(new Date(contribution.createdAt), "PPp")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        reviewMutation.mutate({
                          id: contribution.id,
                          decision: "approve",
                        })
                      }
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Approve & publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        reviewMutation.mutate({
                          id: contribution.id,
                          decision: "reject",
                        })
                      }
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
