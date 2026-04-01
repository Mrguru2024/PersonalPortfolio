"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export type InitialTemplate = {
  id?: number;
  name: string;
  category: string;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string | null;
  accessScope: string;
};

interface TemplateFormProps {
  initial: InitialTemplate;
  isSuper: boolean;
  mode: "create" | "edit";
}

export function EmailHubTemplateForm({ initial, isSuper, mode }: TemplateFormProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category || "general");
  const [subjectTemplate, setSubjectTemplate] = useState(initial.subjectTemplate);
  const [htmlTemplate, setHtmlTemplate] = useState(initial.htmlTemplate || "<p></p>");
  const [textTemplate, setTextTemplate] = useState(initial.textTemplate ?? "");
  const [accessScope, setAccessScope] = useState(initial.accessScope || "private");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/email-hub/templates", {
        id: mode === "edit" ? initial.id : undefined,
        name: name.trim(),
        category,
        subjectTemplate: subjectTemplate.trim(),
        htmlTemplate,
        textTemplate: textTemplate.trim() || null,
        accessScope: isSuper ? accessScope : "private",
      });
      return res.json() as Promise<{ id: number }>;
    },
    onSuccess: (row) => {
      toast({ title: mode === "create" ? "Template created" : "Template saved" });
      void qc.invalidateQueries({ queryKey: ["/api/admin/email-hub/templates"] });
      if (mode === "create" && row?.id) {
        router.replace(`/admin/email-hub/templates/${row.id}/edit`);
      }
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <p className="text-sm text-muted-foreground">
        Merge tags in subject or body:{" "}
        <code className="text-xs bg-muted px-1 rounded">{"{{firstName}}"}</code>,{" "}
        <code className="text-xs bg-muted px-1 rounded">{"{{company}}"}</code>,{" "}
        <code className="text-xs bg-muted px-1 rounded">{"{{bookingLink}}"}</code>, etc. (same as Compose).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tpl-name">Name</Label>
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Welcome sequence — introduction"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="nurture">Nurture</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isSuper ? (
        <div className="space-y-2 max-w-xs">
          <Label>Access</Label>
          <Select value={accessScope} onValueChange={setAccessScope}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private (creator only)</SelectItem>
              <SelectItem value="org">Org (all admins can use)</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="tpl-subject">Subject line template</Label>
        <Input
          id="tpl-subject"
          value={subjectTemplate}
          onChange={(e) => setSubjectTemplate(e.target.value)}
          placeholder="Hi {{firstName}}, quick follow-up"
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>HTML body</Label>
        <p className="text-xs text-muted-foreground">
          Full visual editor: alignment, colors, highlights, images (uploads go to Email Hub assets), tables, dividers.
        </p>
        <RichTextEditor
          content={htmlTemplate}
          onChange={setHtmlTemplate}
          placeholder="Build your email layout…"
          advanced
          imageUploadTarget="emailHub"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tpl-plain">Plain text fallback (optional)</Label>
        <Textarea
          id="tpl-plain"
          value={textTemplate}
          onChange={(e) => setTextTemplate(e.target.value)}
          rows={5}
          className="rounded-xl font-mono text-sm"
          placeholder="Auto-generated from HTML if left empty at send time in some clients; optional here."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !name.trim() || !subjectTemplate.trim()}
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Create template" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/email-hub/templates")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
