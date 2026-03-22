"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { linesToStringArray } from "@/lib/personaFormUtils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface QuickCreatePersonaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after a successful create; parent can select the new id, etc. */
  onCreated?: (persona: { id: string; displayName: string }) => void;
}

const emptyForm = () => ({
  id: "",
  displayName: "",
  segment: "",
  revenueBand: "",
  summary: "",
  strategicNote: "",
  problems: "",
  goals: "",
  objections: "",
  dynamicSignals: "",
});

export function QuickCreatePersonaModal({ open, onOpenChange, onCreated }: QuickCreatePersonaModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) setForm(emptyForm());
  }, [open]);

  const slug = form.id.trim().toLowerCase();
  const slugOk = /^[a-z0-9][a-z0-9-]*$/.test(slug);
  const canSubmit = slugOk && form.displayName.trim().length > 0;

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/ascendra-intelligence/personas", {
        id: slug,
        displayName: form.displayName.trim(),
        segment: form.segment.trim() || null,
        revenueBand: form.revenueBand.trim() || null,
        summary: form.summary.trim() || null,
        strategicNote: form.strategicNote.trim() || null,
        problems: linesToStringArray(form.problems),
        goals: linesToStringArray(form.goals),
        objections: linesToStringArray(form.objections),
        dynamicSignals: linesToStringArray(form.dynamicSignals),
      });
      return (await res.json()) as { persona: { id: string; displayName: string } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/personas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ascendra-intelligence/summary"] });
      toast({ title: "Persona created", description: data.persona.displayName });
      onOpenChange(false);
      onCreated?.(data.persona);
    },
    onError: (e: Error) => {
      toast({ title: "Could not create persona", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[min(92dvh,calc(100dvh-1rem))] w-[min(100%,calc(100vw-1rem))] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[min(90dvh,calc(100dvh-2rem))]",
          "top-4 translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]",
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-4 pb-4 pt-6 pr-12 text-left sm:px-6 sm:pr-14">
          <DialogTitle className="text-base sm:text-lg">New marketing persona</DialogTitle>
          <DialogDescription className="text-left text-xs sm:text-sm">
            Stable <code className="rounded bg-muted px-1 text-[0.7rem] sm:text-xs">id</code> slug (e.g.{" "}
            <code className="rounded bg-muted px-1 text-[0.7rem] sm:text-xs">studio-owner</code>) — used across IQ,
            scripts, and lead magnets.{" "}
            <Link
              href="/admin/ascendra-intelligence/personas/new"
              className="text-primary underline underline-offset-4"
              onClick={() => onOpenChange(false)}
            >
              Open full editor
            </Link>{" "}
            for a dedicated page.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qcp-id">Persona id (slug)</Label>
              <Input
                id="qcp-id"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="e.g. studio-owner"
                autoComplete="off"
                className="font-mono text-sm"
              />
              {form.id.trim() && !slugOk ? (
                <p className="text-xs text-destructive">
                  Lowercase letters, numbers, hyphens; must start with a letter or digit.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-name">Display name</Label>
              <Input
                id="qcp-name"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g. Alex – Studio owner"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qcp-seg">Segment</Label>
                <Input
                  id="qcp-seg"
                  value={form.segment}
                  onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qcp-rev">Revenue band</Label>
                <Input
                  id="qcp-rev"
                  value={form.revenueBand}
                  onChange={(e) => setForm((f) => ({ ...f, revenueBand: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-sum">Summary</Label>
              <Textarea
                id="qcp-sum"
                rows={3}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                className="min-h-[4.5rem] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-strat">Strategic note</Label>
              <Textarea
                id="qcp-strat"
                rows={2}
                value={form.strategicNote}
                onChange={(e) => setForm((f) => ({ ...f, strategicNote: e.target.value }))}
                className="resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-prob">Problems (one per line)</Label>
              <Textarea
                id="qcp-prob"
                rows={4}
                value={form.problems}
                onChange={(e) => setForm((f) => ({ ...f, problems: e.target.value }))}
                className="min-h-[4rem] resize-y sm:min-h-[5rem]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-goals">Goals (one per line)</Label>
              <Textarea
                id="qcp-goals"
                rows={3}
                value={form.goals}
                onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
                className="min-h-[4rem] resize-y sm:min-h-[5rem] sm:rows-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-obj">Objections (one per line)</Label>
              <Textarea
                id="qcp-obj"
                rows={3}
                value={form.objections}
                onChange={(e) => setForm((f) => ({ ...f, objections: e.target.value }))}
                className="min-h-[3.5rem] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qcp-dyn">Dynamic signals (one per line)</Label>
              <Textarea
                id="qcp-dyn"
                rows={3}
                value={form.dynamicSignals}
                onChange={(e) => setForm((f) => ({ ...f, dynamicSignals: e.target.value }))}
                className="min-h-[3.5rem] resize-y"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/20 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canSubmit || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create &amp; use
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
