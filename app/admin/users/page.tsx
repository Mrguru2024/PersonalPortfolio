"use client";

import { useAuth } from "@/hooks/use-auth";
import { isSuperAdminUser } from "@/lib/super-admin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  UserCheck,
  Shield,
  User,
  KeyRound,
  Users,
  Mail,
  UserPlus,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRIVILEGE_OPTIONS: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "crm", label: "CRM" },
  { key: "growth_os", label: "Growth OS (granular)" },
  { key: "internal_team", label: "Internal team tools" },
  { key: "blog", label: "Blog & Blog Analytics" },
  { key: "pages", label: "Edit page content" },
  { key: "announcements", label: "Announcements" },
  { key: "newsletters", label: "Newsletters & Subscribers" },
  { key: "funnel", label: "Funnel" },
  { key: "invoices", label: "Invoices" },
  { key: "feedback", label: "Feedback" },
];

interface UserRow {
  id: number;
  username: string;
  email: string | null;
  isAdmin: boolean;
  adminApproved: boolean;
  role: string | null;
  permissions: Record<string, boolean> | null;
  created_at: string | null;
}

interface Stats {
  crmLeadsCount: number;
  crmClientsCount: number;
  subscribersCount: number;
}

export default function AdminUsersPage() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isSuperUser = isSuperAdminUser(user ?? null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (!authLoading && user && !isSuperUser) {
      router.push("/admin/dashboard");
    }
  }, [mounted, user, authLoading, router, isSuperUser]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load users");
      }
      return res.json() as Promise<UserRow[]>;
    },
    enabled: !!user && !!isSuperUser,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/users/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users/stats");
      if (!res.ok) return { crmLeadsCount: 0, crmClientsCount: 0, subscribersCount: 0 };
      return res.json() as Promise<Stats>;
    },
    enabled: !!user && !!isSuperUser,
  });

  const [privilegesUser, setPrivilegesUser] = useState<UserRow | null>(null);
  const [privilegesDraft, setPrivilegesDraft] = useState<Record<string, boolean>>({});

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/admin/users/approve", { userId });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to approve");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "User approved", description: "They now have founder admin access." });
    },
    onError: (e: Error) => {
      toast({ title: "Approval failed", description: e.message, variant: "destructive" });
    },
  });

  const permissionsMutation = useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: number;
      permissions: Record<string, boolean>;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/permissions`, {
        permissions,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update privileges");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Privileges updated", description: "User access has been saved." });
      setPrivilegesUser(null);
    },
    onError: (e: Error) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  const openPrivileges = (u: UserRow) => {
    if (u.role === "developer") return;
    setPrivilegesUser(u);
    setPrivilegesDraft({ ...(u.permissions ?? {}) });
  };

  const savePrivileges = () => {
    if (!privilegesUser) return;
    permissionsMutation.mutate({
      userId: privilegesUser.id,
      permissions: privilegesDraft,
    });
  };

  // Same initial output on server and client to avoid hydration mismatch (auth not available on server)
  if (!mounted || authLoading || (user && !isSuperUser)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const pending = users.filter((u) => u.isAdmin && !u.adminApproved);
  const adminUsers = users.filter(
    (u) => u.role === "developer" || (u.isAdmin && u.adminApproved)
  );
  const guestUsers = users.filter((u) => !u.isAdmin);

  return (
    <div className="w-full min-w-0 max-w-full py-6 sm:py-10">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground mb-4">
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            User management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize admin access, guest users, CRM leads & clients, and newsletter subscribers. Approve founders and control their privileges.
          </p>
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview — counts and quick links */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Card className="border-border bg-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{adminUsers.length}</p>
                        <p className="text-xs text-muted-foreground">Admin users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-500/10 p-2">
                        <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{pending.length}</p>
                        <p className="text-xs text-muted-foreground">Pending approval</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{guestUsers.length}</p>
                        <p className="text-xs text-muted-foreground">Guest users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <Link
                      href="/admin/crm?type=lead"
                      className="flex items-center justify-between gap-2 text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500/10 p-2">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "—" : stats?.crmLeadsCount ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">CRM leads</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <Link
                      href="/admin/crm?type=client"
                      className="flex items-center justify-between gap-2 text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-500/10 p-2">
                          <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "—" : stats?.crmClientsCount ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">CRM clients</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border bg-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <Link
                      href="/admin/newsletters/subscribers"
                      className="flex items-center justify-between gap-2 text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-500/10 p-2">
                          <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {statsLoading ? "—" : stats?.subscribersCount ?? 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Subscribers</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Pending approval */}
            {pending.length > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Pending approval ({pending.length})
                  </CardTitle>
                  <CardDescription>
                    These users requested founder admin access. Approve to grant dashboard, CRM, blog, and content tools.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pending.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div>
                        <p className="font-medium">{u.username}</p>
                        {u.email && (
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Admin users */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin users
                </CardTitle>
                <CardDescription>
                  Super users have full access. Founders have access only to areas you enable via Edit privileges.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No admin users.</p>
                ) : (
                  <ul className="space-y-2">
                    {adminUsers.map((u) => (
                      <li
                        key={u.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{u.username}</span>
                        {u.email && (
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {u.email}
                          </span>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.role === "developer" && (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Super user
                            </Badge>
                          )}
                          {u.isAdmin && u.adminApproved && u.role !== "developer" && (
                            <>
                              <Badge variant="secondary">Founder</Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1 h-7 text-xs"
                                onClick={() => openPrivileges(u)}
                              >
                                <KeyRound className="h-3 w-3" />
                                Edit privileges
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Guest users */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Guest users
                </CardTitle>
                <CardDescription>
                  Registered users who do not have admin access. They can sign in to the site; grant admin and approve above if they should become founders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {guestUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No guest users.</p>
                ) : (
                  <ul className="space-y-2">
                    {guestUsers.map((u) => (
                      <li
                        key={u.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{u.username}</span>
                        {u.email && (
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {u.email}
                          </span>
                        )}
                        <Badge variant="outline">Guest</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Access & monitoring */}
            <Card className="border-border bg-card border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Access & monitoring
                </CardTitle>
                <CardDescription>
                  Where to manage and monitor different audiences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Admin access</strong> — Controlled per founder via Edit privileges above. Each founder only sees admin areas you enable (Dashboard, CRM, Blog, Newsletters, etc.).
                </p>
                <p>
                  <strong className="text-foreground">Leads & clients</strong> — Managed in{" "}
                  <Link href="/admin/crm" className="font-medium text-primary hover:underline">
                    CRM
                  </Link>
                  . Filter by lead vs client; view timelines, tasks, and engagement.
                </p>
                <p>
                  <strong className="text-foreground">Subscribers</strong> — Newsletter list and signups in{" "}
                  <Link
                    href="/admin/newsletters/subscribers"
                    className="font-medium text-primary hover:underline"
                  >
                    Newsletters → Subscribers
                  </Link>
                  . Add, remove, and segment.
                </p>
              </CardContent>
            </Card>

            <Dialog
              open={!!privilegesUser}
              onOpenChange={(open) => !open && setPrivilegesUser(null)}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit privileges</DialogTitle>
                  <DialogDescription>
                    {privilegesUser
                      ? `Grant or revoke access for ${privilegesUser.username}. They will only see admin areas you enable.`
                      : ""}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  {PRIVILEGE_OPTIONS.map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priv-${key}`}
                        checked={privilegesDraft[key] === true}
                        onCheckedChange={(checked) =>
                          setPrivilegesDraft((prev) => ({
                            ...prev,
                            [key]: checked === true,
                          }))
                        }
                      />
                      <label
                        htmlFor={`priv-${key}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPrivilegesUser(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={savePrivileges}
                    disabled={permissionsMutation.isPending}
                  >
                    {permissionsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
