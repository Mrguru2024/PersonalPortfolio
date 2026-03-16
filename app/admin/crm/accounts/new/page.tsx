"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NewAccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [notesSummary, setNotesSummary] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/crm/accounts", {
        name: name.trim(),
        website: website.trim() || null,
        industry: industry.trim() || null,
        notesSummary: notesSummary.trim() || null,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to create");
      }
      return res.json();
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/accounts"] });
      toast({ title: "Account created" });
      router.push(`/admin/crm/accounts/${data.id}`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (authLoading || !user) return null;

  return (
    <div className="container max-w-xl py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/crm/accounts"><ArrowLeft className="h-4 w-4 mr-1" /> Accounts</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add account</CardTitle>
          <CardDescription>Create a new company/organization record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. SaaS, E-commerce"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder="Brief summary or notes…"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create account"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/crm/accounts">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
