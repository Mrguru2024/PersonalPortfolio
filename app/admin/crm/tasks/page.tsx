"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface TaskWithContact {
  id: number;
  contactId: number;
  type: string;
  title: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  contact?: { id: number; name: string; email: string };
}

export default function CrmTasksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: allTasks = [], isLoading: allLoading } = useQuery<TaskWithContact[]>({
    queryKey: ["/api/admin/crm/tasks", "all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/tasks?incompleteOnly=true");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: overdueTasks = [], isLoading: overdueLoading } = useQuery<TaskWithContact[]>({
    queryKey: ["/api/admin/crm/tasks", "overdue"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/tasks?overdueOnly=true");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-4xl">
        <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/crm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mt-2">Tasks</h1>
        <p className="text-muted-foreground">Follow-ups, calls, and to-dos</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="inline-flex flex-nowrap items-center gap-1 p-1.5 min-h-[44px] rounded-lg bg-muted/80 [&>button]:shrink-0 [&>button]:min-h-[40px]">
          <TabsTrigger value="all">My tasks</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {allLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : allTasks.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No open tasks.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {allTasks.map((t) => (
                <Card key={t.id}>
                  <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.type} · {t.priority}
                        {t.dueAt && ` · Due ${format(new Date(t.dueAt), "PP")}`}
                      </p>
                      {t.contact && (
                        <Link href={`/admin/crm/${t.contactId}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                          {t.contact.name}
                        </Link>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/crm/${t.contactId}`}>View lead</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          {overdueLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : overdueTasks.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No overdue tasks.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map((t) => (
                <Card key={t.id} className="border-destructive/50">
                  <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="font-medium">{t.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Overdue {t.dueAt && format(new Date(t.dueAt), "PP")}
                          {t.contact && ` · ${t.contact.name}`}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/crm/${t.contactId}`}>View lead</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
