"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, List, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface SavedList {
  id: number;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

export default function CrmSavedListsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: lists = [], isLoading } = useQuery<SavedList[]>({
    queryKey: ["/api/admin/crm/saved-lists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/saved-lists");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  if (authLoading) return <div className="container mx-auto px-4 py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/crm"><ArrowLeft className="h-4 w-4 mr-2" /> Back to CRM</Link>
      </Button>
      <h1 className="text-2xl font-bold mt-4">Saved lists</h1>
      <p className="text-muted-foreground text-sm mt-1">Smart filters to quickly view segments (e.g. high intent, no contact in 7 days).</p>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : lists.length === 0 ? (
        <Card className="mt-6"><CardContent className="py-12 text-center text-muted-foreground">No saved lists. Create one from the API or add a create form here.</CardContent></Card>
      ) : (
        <div className="mt-6 space-y-2">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className="text-xs text-muted-foreground">{JSON.stringify(list.filters)}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/crm?listId=${list.id}`}><Eye className="h-4 w-4 mr-2" /> View contacts</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
