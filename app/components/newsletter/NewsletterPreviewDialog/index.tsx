"use client";

import { useMemo, useState } from "react";
import { Eye, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  buildNewsletterPreviewForDialog,
  type NewsletterPreviewSampleMode,
} from "@/lib/newsletterPreview";

export interface NewsletterPreviewDialogProps {
  subject: string;
  previewText: string;
  contentHtml: string;
  triggerLabel?: string;
}

export function NewsletterPreviewDialog({
  subject,
  previewText,
  contentHtml,
  triggerLabel = "Preview as recipient",
}: NewsletterPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState<NewsletterPreviewSampleMode>("typical_subscriber");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";

  const preview = useMemo(
    () =>
      buildNewsletterPreviewForDialog({
        subject,
        previewText,
        bodyHtml: contentHtml,
        baseUrl: baseUrl || "https://example.com",
        siteLinkLabel: "Visit our website",
        sample,
      }),
    [subject, previewText, contentHtml, baseUrl, sample],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>Recipient preview</DialogTitle>
          <DialogDescription>
            Merge tags are filled with a sample profile so you can review layout and personalization. Sent mail also
            includes a site link at the bottom, shown here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sample recipient</Label>
          <RadioGroup
            value={sample}
            onValueChange={(v) => setSample(v as NewsletterPreviewSampleMode)}
            className="flex flex-col gap-2"
          >
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="typical_subscriber" id="pv-sub" />
              <span>Typical subscriber (name from email only)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="crm_contact" id="pv-crm" />
              <span>CRM-style row (first name, company filled in)</span>
            </label>
          </RadioGroup>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1 shrink-0">
          <p>
            <span className="text-muted-foreground">Subject:</span>{" "}
            <span className="font-medium text-foreground">{preview.subject || "(empty)"}</span>
          </p>
          {preview.previewText ? (
            <p>
              <span className="text-muted-foreground">Preview line:</span>{" "}
              <span className="text-foreground">{preview.previewText}</span>
            </p>
          ) : null}
        </div>

        <div
          className={`min-h-0 flex-1 rounded-lg border border-border bg-muted/40 overflow-hidden flex justify-center ${
            viewport === "mobile" ? "py-3 px-2" : "p-1"
          }`}
        >
          <div
            className={
              viewport === "mobile"
                ? "w-full max-w-[390px] rounded-[12px] border border-border shadow-md bg-background overflow-hidden"
                : "w-full min-w-0"
            }
          >
            <iframe
              title="Newsletter preview"
              className="w-full h-[min(560px,65vh)] bg-white block"
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:12px;font-family:system-ui,sans-serif;background:#fafafa;">${preview.bodyHtml}</body></html>`}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
