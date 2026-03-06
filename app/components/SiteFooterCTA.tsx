"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HIDDEN_PREFIXES = ["/admin", "/dashboard", "/auth"];

export default function SiteFooterCTA() {
  const pathname = usePathname();
  const currentPath = pathname || "/";

  const hideFooter =
    HIDDEN_PREFIXES.some((prefix) => currentPath.startsWith(prefix)) ||
    currentPath.startsWith("/proposal/view");

  if (hideFooter) return null;

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <p className="font-semibold">Ready to turn your website into a growth system?</p>
            <p className="text-sm text-muted-foreground">
              Start with an audit. Then book a strategy call to map next steps.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/audit">
                <Search className="mr-2 h-4 w-4" />
                Get Your Free Website Growth Audit
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/schedule">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

