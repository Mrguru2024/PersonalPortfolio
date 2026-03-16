"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRIMARY_CTA, SECONDARY_CTA, AUDIT_PATH, BRAND_GROWTH_PATH, STRATEGY_CALL_PATH, FREE_GROWTH_TOOLS_PATH, STARTUP_GROWTH_KIT_PATH } from "@/lib/funnelCtas";
import { COMPANY_ADDRESS, COMPANY_PHONE_DISPLAY, COMPANY_PHONE_E164 } from "@/lib/company";
import { Search } from "lucide-react";

const MAIN_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Results", href: "/results" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const GROWTH_LINKS = [
  { label: "Brand Growth", href: BRAND_GROWTH_PATH },
  { label: "Ecosystem founders", href: "/ecosystem-founders" },
  { label: "Free growth tools", href: FREE_GROWTH_TOOLS_PATH },
  { label: "Startup growth kit", href: STARTUP_GROWTH_KIT_PATH },
  { label: "Our work", href: "/partners/ascendra-technologies#projects" },
];

const WHO_WE_SERVE_LINKS = [
  { label: "For Contractors", href: "/contractor-systems" },
  { label: "Local Business", href: "/local-business-growth" },
  { label: "Startup MVP", href: "/startup-mvp-development" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Request data deletion", href: "/data-deletion-request" },
];

function LinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {links.map(({ label, href }) => (
          <li key={label}>
            <Link href={href} className="hover:text-foreground transition-colors py-2.5 -my-1 sm:py-0 sm:my-0 block sm:inline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer
      className="w-full min-w-0 max-w-full border-t border-border bg-muted/30 dark:bg-muted/10 mt-auto shrink-0"
      aria-label="Site footer"
    >
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-10 pb-safe min-w-0 max-w-full">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Button asChild size="sm" className="gap-1.5 min-h-[44px] sm:min-h-[36px] bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm">
                <Link href={AUDIT_PATH}>
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  {PRIMARY_CTA}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="min-h-[44px] sm:min-h-[36px] border-border hover:bg-accent hover:text-accent-foreground">
                <Link href={STRATEGY_CALL_PATH}>{SECONDARY_CTA}</Link>
              </Button>
            </div>
          </div>
          <nav
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
            aria-label="Footer navigation"
          >
            <LinkGroup title="Main" links={MAIN_LINKS} />
            <LinkGroup title="Growth" links={GROWTH_LINKS} />
            <LinkGroup title="Who we serve" links={WHO_WE_SERVE_LINKS} />
            <LinkGroup title="Legal" links={LEGAL_LINKS} />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact
              </span>
              <address className="not-italic text-sm text-muted-foreground space-y-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS.line)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors block"
                >
                  {COMPANY_ADDRESS.street}
                  <br />
                  {COMPANY_ADDRESS.city}, {COMPANY_ADDRESS.region} {COMPANY_ADDRESS.postalCode}
                  <br />
                  {COMPANY_ADDRESS.country}
                </a>
                <a href={`tel:${COMPANY_PHONE_E164}`} className="hover:text-foreground transition-colors block">
                  {COMPANY_PHONE_DISPLAY}
                </a>
              </address>
            </div>
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
