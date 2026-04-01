"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type LegalClauseRow = {
  id: number;
  slug: string;
  category: string;
  title: string;
  bodyHtml: string;
  sortOrder: number;
  isActive: boolean;
  lawyerReviewedAt: Date | string | null;
  lawyerReviewerName: string | null;
  lawyerFirmName: string | null;
  reviewNotes: string | null;
};

export default function AdminGrowthPlatformClausesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [lawyerReviewerName, setLawyerReviewerName] = useState("");
  const [lawyerFirmName, setLawyerFirmName] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [lawyerReviewedAt, setLawyerReviewedAt] = useState("");

  useEffect(() => {
    if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const listQuery = useQuery({
    queryKey: ["/api/admin/legal-clauses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/legal-clauses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const j = (await res.json()) as { clauses: LegalClauseRow[] };
      return j.clauses ?? [];
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/legal-clauses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          category,
          title,
          bodyHtml,
          sortOrder: Number(sortOrder) || 0,
          isActive,
          lawyerReviewerName: lawyerReviewerName.trim() || null,
          lawyerFirmName: lawyerFirmName.trim() || null,
          reviewNotes: reviewNotes.trim() || null,
          lawyerReviewedAt: lawyerReviewedAt.trim() ? lawyerReviewedAt : null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Save failed");
      return j;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["/api/admin/legal-clauses"] });
      toast({ title: "Clause saved", description: slug });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function loadRow(row: LegalClauseRow) {
    setSlug(row.slug);
    setCategory(row.category);
    setTitle(row.title);
    setBodyHtml(row.bodyHtml);
    setSortOrder(String(row.sortOrder));
    setIsActive(row.isActive);
    setLawyerReviewerName(row.lawyerReviewerName ?? "");
    setLawyerFirmName(row.lawyerFirmName ?? "");
    setReviewNotes(row.reviewNotes ?? "");
    setLawyerReviewedAt(
      row.lawyerReviewedAt ? String(row.lawyerReviewedAt).slice(0, 10) : "",
    );
  }

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {authLoading ?
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
          </span>
        : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 pb-16">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/growth-platform">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Growth platform
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/growth-platform/agreements">Service agreements</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agreement clause library</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Lawyer-reviewable HTML blocks composed into generated agreements. Counsel should approve wording before production
          use; track review with the fields below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit clause</CardTitle>
          <CardDescription>
            Slug is the stable key (e.g. payment-terms). Saving updates an existing slug or inserts a new one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="no-guarantee" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} type="number" />
          </div>
          <div className="space-y-2 flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Body (HTML)</Label>
            <Textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={12} className="font-mono text-xs" />
          </div>
          <div className="space-y-2 sm:col-span-2 border-t pt-4 grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Counsel reviewer name</Label>
              <Input value={lawyerReviewerName} onChange={(e) => setLawyerReviewerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Firm</Label>
              <Input value={lawyerFirmName} onChange={(e) => setLawyerFirmName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Review date (ISO day)</Label>
              <Input type="date" value={lawyerReviewedAt} onChange={(e) => setLawyerReviewedAt(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Review notes</Label>
              <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button type="button" disabled={saveMut.isPending || !slug.trim() || !title.trim()} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save clause"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All clauses</CardTitle>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ?
            <Loader2 className="h-5 w-5 animate-spin" />
          : !(listQuery.data?.length) ?
            <p className="text-sm text-muted-foreground">No clauses yet. Run the seed script or add one above.</p>
          : (
            <ul className="space-y-2 text-sm">
              {listQuery.data.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                  <span>
                    <strong className="font-mono text-xs">{row.slug}</strong> — {row.title}{" "}
                    <span className="text-muted-foreground">({row.category})</span>
                    {row.lawyerReviewedAt ?
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 ml-2">reviewed</span>
                    : null}
                  </span>
                  <Button type="button" size="sm" variant="secondary" onClick={() => loadRow(row)}>
                    Load
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
