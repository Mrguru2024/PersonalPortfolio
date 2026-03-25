"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save, Send, Copy, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMM_DESIGN_CATEGORIES } from "@shared/communicationsSchema";
import { countExternalHttpLinks } from "@/lib/commEmailBlocks";
import { EmailDesignBlocksEditor } from "@/components/communications/EmailDesignBlocksEditor";

type Design = {
  id: number;
  name: string;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  category: string;
  status: string;
  blocksJson: unknown;
  organizationId: number | null;
};

type AiAssistResult =
  | { ok: true; lines?: string[]; preheader?: string; html?: string; note?: string }
  | { ok: false; error: string };

export default function EditCommDesignPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [category, setCategory] = useState("general");
  const [testTo, setTestTo] = useState("");
  const [testContactId, setTestContactId] = useState<string>("");
  const [blockRows, setBlockRows] = useState<string[]>([""]);
  const [organizationIdText, setOrganizationIdText] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [subjectLinesOpen, setSubjectLinesOpen] = useState(false);
  const [subjectLines, setSubjectLines] = useState<string[]>([]);
  const [polishOpen, setPolishOpen] = useState(false);
  const [polishHtml, setPolishHtml] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const { data: crmContactsForTest = [] } = useQuery({
    queryKey: ["/api/admin/crm/contacts", "comm-test-send"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/contacts");
      return res.json() as Promise<{ id: number; name: string; email: string }[]>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: design, isLoading } = useQuery({
    queryKey: ["/api/admin/communications/designs", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/communications/designs/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Design>;
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && !!id,
  });

  useEffect(() => {
    if (design) {
      setName(design.name);
      setSubject(design.subject);
      setPreviewText(design.previewText ?? "");
      setContent(design.htmlContent || "<p></p>");
      setCategory(design.category);
      if (Array.isArray(design.blocksJson)) {
        const ids = design.blocksJson
          .map((item) => {
            if (item && typeof item === "object" && "id" in item) return String((item as { id: unknown }).id ?? "");
            return "";
          })
          .filter((s) => s.length > 0);
        setBlockRows(ids.length ? ids : [""]);
      } else {
        setBlockRows([""]);
      }
      setOrganizationIdText(
        design.organizationId != null && Number.isFinite(design.organizationId) ? String(design.organizationId) : ""
      );
    }
  }, [design]);

  const assistMutation = useMutation({
    mutationFn: async (intent: "subject_lines" | "preheader" | "html_section" | "polish_html") => {
      const res = await apiRequest("POST", `/api/admin/communications/designs/${id}/ai-assist`, {
        intent,
        instruction: aiInstruction.trim() || undefined,
        subject,
        previewText,
        htmlSample: content,
      });
      const json = (await res.json()) as AiAssistResult & { error?: string };
      if (!res.ok) throw new Error((json as { error?: string }).error || "AI assist failed");
      return json as AiAssistResult;
    },
    onSuccess: (data, intent) => {
      if (!data.ok) {
        toast({ title: "AI assist", description: data.error, variant: "destructive" });
        return;
      }
      if (intent === "subject_lines") {
        if (data.lines?.length) {
          setSubjectLines(data.lines);
          setSubjectLinesOpen(true);
        } else {
          toast({ title: "AI assist", description: data.note || "No subject lines returned", variant: "destructive" });
        }
        return;
      }
      if (intent === "preheader") {
        if (data.preheader) {
          setPreviewText(data.preheader);
          toast({ title: "Preview text updated" });
        } else {
          toast({ title: "AI assist", description: "No preheader returned", variant: "destructive" });
        }
        return;
      }
      if (intent === "html_section") {
        if (data.html) {
          setContent((prev) => `${prev}\n${data.html}`);
          toast({ title: "Section appended to body" });
        } else {
          toast({ title: "AI assist", description: "No HTML returned", variant: "destructive" });
        }
        return;
      }
      if (intent === "polish_html") {
        if (data.html) {
          setPolishHtml(data.html);
          setPolishOpen(true);
        } else {
          toast({ title: "AI assist", description: "No HTML returned", variant: "destructive" });
        }
      }
    },
    onError: (e: Error) => toast({ title: "AI assist", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const blocksJson = blockRows.map((s) => s.trim()).filter(Boolean).map((bid) => ({ id: bid }));

      const orgTrim = organizationIdText.trim();
      let organizationId: number | null = null;
      if (orgTrim !== "") {
        const n = Number(orgTrim);
        if (!Number.isFinite(n)) throw new Error("Organization ID must be a number");
        organizationId = n;
      }

      const temp = document.createElement("div");
      temp.innerHTML = content;
      const plain = temp.textContent || temp.innerText || "";
      const res = await apiRequest("PATCH", `/api/admin/communications/designs/${id}`, {
        name,
        subject,
        previewText,
        htmlContent: content,
        plainText: plain,
        category,
        blocksJson,
        organizationId,
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Saved" });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/designs"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/communications/designs", id] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const dupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/communications/designs/${id}/duplicate`, {});
      if (!res.ok) throw new Error("Duplicate failed");
      return res.json() as Promise<{ id: number }>;
    },
    onSuccess: (row) => {
      toast({ title: "Duplicated" });
      router.push(`/admin/communications/designs/${row.id}`);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const body: { to: string; contactId?: number } = { to: testTo.trim() };
      const cid = testContactId ? Number(testContactId) : NaN;
      if (Number.isFinite(cid)) body.contactId = cid;
      const res = await apiRequest("POST", `/api/admin/communications/designs/${id}/test-send`, body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Send failed");
      }
      return res.json();
    },
    onSuccess: () => toast({ title: "Test email sent" }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const externalLinkCount = useMemo(() => countExternalHttpLinks(content), [content]);

  if (authLoading || !user?.isAdmin || !user?.adminApproved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !design) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/communications/designs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Designs
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit design</CardTitle>
          <CardDescription>Save changes, duplicate, or send a test (no tracking pixel).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Internal name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMM_DESIGN_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Organization ID (optional)</Label>
            <Input
              value={organizationIdText}
              onChange={(e) => setOrganizationIdText(e.target.value)}
              placeholder="Leave blank for default"
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground">For future multi-tenant scoping; unused in single-tenant admin today.</p>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Preview text</Label>
            <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} />
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI assist</span>
              <span className="text-xs text-muted-foreground">Uses current fields above + body below (via request body).</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Optional instruction</Label>
              <Input
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="e.g. Shorter, more direct, mention ROI"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={assistMutation.isPending}
                onClick={() => assistMutation.mutate("subject_lines")}
              >
                {assistMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Subject lines
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={assistMutation.isPending}
                onClick={() => assistMutation.mutate("preheader")}
              >
                Preheader
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={assistMutation.isPending}
                onClick={() => assistMutation.mutate("html_section")}
              >
                Add HTML section
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={assistMutation.isPending}
                onClick={() => assistMutation.mutate("polish_html")}
              >
                Polish full body
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <p className="text-xs text-muted-foreground">
              Merge tags: {"{{firstName}}"}, {"{{Name}}"}, {"{{company}}"}, {"{{email}}"} — use &quot;Preview merge from
              contact&quot; in test send to sample real CRM values.
            </p>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <EmailDesignBlocksEditor
            blockRows={blockRows}
            onBlockRowsChange={setBlockRows}
            externalLinkCount={externalLinkCount}
          />

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => dupMutation.mutate()} disabled={dupMutation.isPending}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test send
          </CardTitle>
          <CardDescription>
            Uses Brevo transactional API. Subject prefixed with [TEST]. Optional CRM contact fills merge tags; otherwise
            tags use the test inbox address.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Recipient email</Label>
              <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Preview merge from contact (optional)</Label>
              <Select value={testContactId || "__none__"} onValueChange={(v) => setTestContactId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None — use test email only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {crmContactsForTest
                    .filter((c) => c.email?.trim())
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => testMutation.mutate()} disabled={!testTo.trim() || testMutation.isPending}>
              {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send test
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings/brevo">Brevo setup and IP allowlist</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={subjectLinesOpen} onOpenChange={setSubjectLinesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subject line ideas</DialogTitle>
            <DialogDescription>Pick one to copy into the subject field.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm max-h-[50vh] overflow-y-auto">
            {subjectLines.map((line) => (
              <li key={line} className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
                <span className="flex-1 min-w-0">{line}</span>
                <Button type="button" size="sm" variant="secondary" onClick={() => setSubject(line)}>
                  Use
                </Button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubjectLinesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={polishOpen} onOpenChange={setPolishOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Polished HTML</DialogTitle>
            <DialogDescription>Review and replace the editor body, or cancel.</DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={polishHtml} className="font-mono text-xs min-h-[200px] flex-1" />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPolishOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setContent(polishHtml);
                setPolishOpen(false);
                toast({ title: "Body replaced with polished HTML" });
              }}
            >
              Replace body
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
