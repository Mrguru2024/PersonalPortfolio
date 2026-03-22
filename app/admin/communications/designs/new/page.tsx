"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMM_DESIGN_CATEGORIES } from "@shared/communicationsSchema";

export default function NewCommDesignPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [category, setCategory] = useState<string>("general");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const temp = document.createElement("div");
      temp.innerHTML = content;
      const plain = temp.textContent || temp.innerText || "";
      const res = await apiRequest("POST", "/api/admin/communications/designs", {
        name,
        subject,
        previewText,
        htmlContent: content,
        plainText: plain,
        category,
        status: "draft",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      return res.json() as Promise<{ id: number }>;
    },
    onSuccess: (data) => {
      toast({ title: "Saved", description: "Design created." });
      router.push(`/admin/communications/designs/${data.id}`);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/communications/designs">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Designs
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New email design</CardTitle>
          <CardDescription>Uses the same TipTap editor as newsletters. Use {"{{firstName}}"} and {"{{company}}"} for merge tags.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Internal name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marcus nurture v2" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMM_DESIGN_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pre">Preview text</Label>
            <Input id="pre" value={previewText} onChange={(e) => setPreviewText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || !subject.trim() || saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save design
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
