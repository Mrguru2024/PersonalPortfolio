"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrimaryFunnelCTAProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function PrimaryFunnelCTA({
  title = "Turn your website into a predictable lead machine",
  description = "Get a conversion-focused audit with clear wins across messaging, UX, speed, SEO, and automation.",
  className,
  compact = false,
}: PrimaryFunnelCTAProps) {
  return (
    <Card
      className={cn(
        "border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-purple-600/10",
        className
      )}
    >
      <CardContent className={cn(compact ? "py-6 px-4" : "py-8 px-5 sm:px-8")}>
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <h3
            className={cn(
              "font-bold text-balance",
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            )}
          >
            {title}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/audit">
                <Search className="mr-2 h-4 w-4" />
                Get Your Free Website Growth Audit
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/schedule">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

