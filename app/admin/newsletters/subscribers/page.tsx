"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Mail, Trash2, UserPlus, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface Subscriber {
  id: number;
  email: string;
  name?: string;
  subscribed: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  source?: string;
  tags?: string[];
}

export default function SubscribersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: subscribers = [], isLoading, error } = useQuery<Subscriber[]>({
    queryKey: ["/api/admin/subscribers"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/subscribers?includeUnsubscribed=true");
        if (!response.ok) {
          // Handle 403 gracefully - user might not be approved yet
          if (response.status === 403) {
            return [];
          }
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch subscribers" }));
          throw new Error(errorData.message || "Failed to fetch subscribers");
        }
        return await response.json();
      } catch (err: any) {
        // If it's a 403 error or admin access error, return empty array instead of throwing
        const errorMessage = err?.message || "";
        if (errorMessage.includes("Admin access required") || 
            errorMessage.includes("403") ||
            errorMessage.includes('"message":"Admin access required"')) {
          return [];
        }
        throw err;
      }
    },
    enabled: !authLoading && !!user && user.isAdmin === true && user.adminApproved === true,
    retry: false,
    throwOnError: false,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/subscribers", {
        email: newEmail,
        name: newName || undefined,
        source: "manual",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscribers"] });
      toast({
        title: "Success",
        description: "Subscriber added successfully",
      });
      setNewEmail("");
      setNewName("");
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add subscriber",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/subscribers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscribers"] });
      toast({
        title: "Success",
        description: "Subscriber deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscriber",
        variant: "destructive",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/admin/subscribers/${id}`, {
        subscribed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscribers"] });
      toast({
        title: "Success",
        description: "Subscriber unsubscribed",
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

  const activeSubscribers = subscribers.filter(s => s.subscribed);
  const unsubscribed = subscribers.filter(s => !s.subscribed);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Subscribers</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your newsletter subscribers
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subscriber</DialogTitle>
                <DialogDescription>Add a new subscriber to your newsletter</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="subscriber@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addMutation.mutate()}
                    disabled={!newEmail || addMutation.isPending}
                  >
                    {addMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Subscriber"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Subscribers ({activeSubscribers.length})</CardTitle>
            <CardDescription>Subscribers who will receive newsletters</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSubscribers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active subscribers</p>
            ) : (
              <div className="space-y-2">
                {activeSubscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{subscriber.email}</div>
                      {subscriber.name && (
                        <div className="text-sm text-muted-foreground">{subscriber.name}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Subscribed {format(new Date(subscriber.subscribedAt), "PP")}
                        {subscriber.source && ` • Source: ${subscriber.source}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unsubscribeMutation.mutate(subscriber.id)}
                      >
                        Unsubscribe
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(subscriber.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {unsubscribed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Unsubscribed ({unsubscribed.length})</CardTitle>
              <CardDescription>Subscribers who have unsubscribed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unsubscribed.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-3 border rounded-lg opacity-60"
                  >
                    <div>
                      <div className="font-medium">{subscriber.email}</div>
                      {subscriber.name && (
                        <div className="text-sm text-muted-foreground">{subscriber.name}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Unsubscribed {subscriber.unsubscribedAt && format(new Date(subscriber.unsubscribedAt), "PP")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(subscriber.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscriber? This action cannot be undone.
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
