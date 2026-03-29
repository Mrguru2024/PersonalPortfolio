"use client";

import { useAuth, isAuthSuperUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminAfnScoringPage() {
  const { user, isLoading } = useAuth();
  const isSuper = isAuthSuperUser(user);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState("{}");

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin || !user.adminApproved)) {
      router.replace("/admin/dashboard");
    }
  }, [user, isLoading, router]);

  const { data, isFetching } = useQuery({
    queryKey: ["/api/admin/Afn/scoring"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/Afn/scoring");
      if (!res.ok) throw new Error("forbidden");
      return res.json() as Promise<{ weightsJson: Record<string, number>; id: number }>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  useEffect(() => {
    if (data?.weightsJson) setJsonText(JSON.stringify(data.weightsJson, null, 2));
  }, [data?.weightsJson]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const weights = JSON.parse(jsonText) as Record<string, number>;
      const res = await apiRequest("PATCH", "/api/admin/Afn/scoring", { weights });
      if (!res.ok) throw new Error("save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/Afn/scoring"] });
      toast({ title: "Scoring weights saved" });
    },
    onError: () =>
      toast({
        title: isSuper ? "Invalid JSON or save failed" : "Could not save weights. Check the format or try again.",
        variant: "destructive",
      }),
  });

  if (isLoading || !user?.isAdmin || !user?.adminApproved) return null;

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>AFN scoring weights</CardTitle>
          <CardDescription>
            {isSuper ?
              "Tunable multipliers for the matching / intelligence stack (Phase 12). Shape is a flat JSON object of numbers."
            : "Advanced weights that tune how member signals affect matching. Incorrect values can skew results—edit carefully."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFetching && !data ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={14} className="font-mono text-xs" />
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
