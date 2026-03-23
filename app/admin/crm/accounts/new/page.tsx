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
import { FieldHint } from "@/lib/field-hint";
import { ADMIN_PLACEHOLDERS, INDUSTRY_SUGGESTIONS } from "@/lib/admin-form-placeholders";

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
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm/accounts"><ArrowLeft className="h-4 w-4 mr-2" />Back to accounts</Link>
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
              placeholder={ADMIN_PLACEHOLDERS.companyName}
              autoComplete="organization"
            />
            <FieldHint>Legal or brand name as you want it to appear in CRM.</FieldHint>
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={ADMIN_PLACEHOLDERS.websiteUrl}
              autoComplete="url"
            />
            <FieldHint>Optional — include https:// so links work in one click.</FieldHint>
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder={ADMIN_PLACEHOLDERS.industry}
              list="crm-industry-suggestions"
              autoComplete="off"
            />
            <datalist id="crm-industry-suggestions">
              {INDUSTRY_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <FieldHint>Pick a suggestion or type your own short label.</FieldHint>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder={ADMIN_PLACEHOLDERS.accountNotes}
              rows={3}
            />
            <FieldHint>Not shown to contacts — for your team only.</FieldHint>
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
    </div>
  );
}
