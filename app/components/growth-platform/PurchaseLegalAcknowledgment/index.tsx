"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface PurchaseLegalAcknowledgmentProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  /** Optional service-engagement path */
  serviceTermsHref?: string;
}

/**
 * Checkbox gate before checkout / deposit flows. Does not replace counsel-reviewed agreements.
 */
export function PurchaseLegalAcknowledgment({
  id = "ascendra-legal-ack",
  checked,
  onCheckedChange,
  disabled,
  serviceTermsHref = "/service-engagement",
}: PurchaseLegalAcknowledgmentProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          disabled={disabled}
          className="mt-1"
        />
        <Label htmlFor={id} className="text-left font-normal leading-relaxed cursor-pointer">
          I have read and agree to the{" "}
          <Link href="/terms" className="underline font-medium text-primary">
            Terms of Service
          </Link>{" "}
          and the{" "}
          <Link href={serviceTermsHref} className="underline font-medium text-primary">
            service engagement expectations
          </Link>
          , including that results depend on my participation, ad spend may be separate, and third-party platforms can
          experience outages outside Ascendra&apos;s control.
        </Label>
      </div>
    </div>
  );
}
