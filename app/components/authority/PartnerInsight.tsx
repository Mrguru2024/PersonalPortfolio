"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FounderProfile, PartnerInsightItem } from "@/lib/partnerFounders";
import { getFounderImageUrl } from "@/lib/partnerFounders";

export interface PartnerInsightProps {
  founder: FounderProfile;
  insight: PartnerInsightItem;
  /** Optional section heading above the card */
  variant?: "card" | "compact";
}

export function PartnerInsight({
  founder,
  insight,
  variant = "card",
}: PartnerInsightProps) {
  const imageUrl = getFounderImageUrl(founder);
  const isExternalImage = imageUrl.startsWith("http");

  if (variant === "compact") {
    return (
      <div className="flex gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
          {imageUrl ? (
            isExternalImage ? (
              <img
                src={imageUrl}
                alt={founder.imageAlt ?? founder.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={founder.imageAlt ?? founder.name}
                fill
                className={founder.useLogo ? "object-contain p-1.5" : "object-cover"}
                sizes="64px"
              />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
              {founder.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">
            {founder.name} · {founder.company}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            {insight.headline}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
            {insight.paragraph}
          </p>
          <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0 text-primary gap-1">
            <Link href={insight.ctaHref}>
              {insight.ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border bg-card h-full flex flex-col">
      <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-lg overflow-hidden bg-muted">
            {imageUrl ? (
              isExternalImage ? (
                <img
                  src={imageUrl}
                  alt={founder.imageAlt ?? founder.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={founder.imageAlt ?? founder.name}
                  fill
                  className={founder.useLogo ? "object-contain p-1.5" : "object-cover"}
                  sizes="56px"
                />
              )
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
                {founder.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{founder.name}</p>
            <Link
              href={founder.companyHref}
              className="text-sm text-primary hover:underline"
            >
              {founder.company}
            </Link>
          </div>
        </div>
        <h3 className="text-base font-semibold text-foreground leading-tight">
          {insight.headline}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground flex-1">
          {insight.paragraph}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5 w-full sm:w-auto">
          <Link href={insight.ctaHref}>
            {insight.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
