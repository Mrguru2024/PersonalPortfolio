"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA, SECONDARY_CTA, AUDIT_PATH, BRAND_GROWTH_PATH, STRATEGY_CALL_PATH } from "@/lib/funnelCtas";
import { Search } from "lucide-react";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Brand Growth", href: BRAND_GROWTH_PATH },
  { label: "Meet the team", href: `${BRAND_GROWTH_PATH}#meet-the-team` },
  { label: "Our work", href: "/partners/ascendra-technologies#projects" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Results", href: "/results" },
  { label: "Free Audit", href: AUDIT_PATH },
  { label: "Strategy Call", href: STRATEGY_CALL_PATH },
  { label: "For Contractors", href: "/contractor-systems" },
  { label: "Local Business", href: "/local-business-growth" },
  { label: "Startup MVP", href: "/startup-mvp-development" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function SiteFooter() {
  return (
    <footer
      className="w-full min-w-0 max-w-full border-t border-border bg-muted/30 dark:bg-muted/10 mt-auto shrink-0"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-10 min-w-0 max-w-full">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Button asChild size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm">
                <Link href={AUDIT_PATH}>
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  {PRIMARY_CTA}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
                <Link href={STRATEGY_CALL_PATH}>{SECONDARY_CTA}</Link>
              </Button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label="Footer navigation">
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            Built in partnership with Style Studio Branding and Macon Designs®.
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ascendra Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
