"use client";

import type { ReactNode } from "react";
import type { OutcomeLandingFrameworkCopy } from "@/lib/landingPageOutcomeFramework";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type OutcomeLandingFrameworkProps = {
  copy: OutcomeLandingFrameworkCopy;
  className?: string;
  id?: string;
  /** Optional CTA row (buttons) below real value */
  children?: ReactNode;
};

export function OutcomeLandingFramework({ copy, className, id, children }: OutcomeLandingFrameworkProps) {
  return (
    <section
      id={id}
      className={cn("w-full min-w-0 max-w-full", className)}
      aria-label="Outcomes, challenges, and value"
    >
      <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
        {copy.audienceLabel ?
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs font-medium">
              {copy.audienceLabel}
            </Badge>
          </div>
        : null}

        <FrameworkBlock
          title={copy.perceivedOutcomes.heading}
          bullets={copy.perceivedOutcomes.bullets}
          variant="outcomes"
        />
        <FrameworkBlock
          title={copy.painAndStruggles.heading}
          bullets={copy.painAndStruggles.bullets}
          variant="pain"
        />
        <FrameworkBlock
          title={copy.whatIfNoAction.heading}
          bullets={copy.whatIfNoAction.bullets}
          variant="risk"
        />

        <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-background">
          <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{copy.realValue.heading}</h2>
            {copy.realValue.intro ?
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{copy.realValue.intro}</p>
            : null}
            <ul className="space-y-2 text-sm sm:text-base text-foreground">
              {copy.realValue.bullets.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-primary font-bold shrink-0" aria-hidden>
                    →
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {copy.disclaimer ?
              <p className="text-xs text-muted-foreground pt-2 border-t border-border/60 leading-relaxed">{copy.disclaimer}</p>
            : null}
          </CardContent>
        </Card>

        {children ?
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center pt-1">{children}</div>
        : null}
      </div>
    </section>
  );
}

function FrameworkBlock({
  title,
  bullets,
  variant,
}: {
  title: string;
  bullets: string[];
  variant: "outcomes" | "pain" | "risk";
}) {
  const icon =
    variant === "outcomes" ? "◎"
    : variant === "pain" ? "△"
    : "!";
  return (
    <Card className="border-border/80 bg-card/80 shadow-sm">
      <CardContent className="pt-5 pb-5 sm:pt-6 sm:pb-6 px-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-primary font-mono text-sm" aria-hidden>
            {icon}
          </span>
          {title}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 leading-relaxed">
              <span className="text-foreground/70 shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
