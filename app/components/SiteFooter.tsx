"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AUDIT_PATH, STRATEGY_CALL_PATH } from "@/lib/funnelCtas";
import { MAIN_LINKS, GROWTH_LINKS, WHO_WE_SERVE_LINKS, LEGAL_LINKS } from "@/lib/siteNavLinks";
import { COMPANY_ADDRESS, COMPANY_PHONE_DISPLAY, COMPANY_PHONE_E164 } from "@/lib/company";
import { Search } from "lucide-react";
import FooterLanguageControl from "@/components/FooterLanguageControl";
import { useLocale } from "@/contexts/LocaleContext";
import type { AppLocale } from "@/lib/i18n/constants";
import { cn } from "@/lib/utils";
import {
  footerContactFormLink,
  footerCopyrightLine,
  footerLinkLabel,
  footerNavAriaLabel,
  footerPartnershipLine,
  footerPrimaryCta,
  footerSecondaryCta,
  footerSectionTitle,
  footerAriaLabel,
  footerTagline,
} from "@/lib/i18n/footerCopy";

function LinkGroup({
  title,
  links,
  className,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <h3 className="border-b border-border/70 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {links.map(({ label, href }) => (
          <li key={`${href}::${label}`}>
            <Link
              href={href}
              className="block rounded-sm py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {/* suppressHydrationWarning: browser translate / extensions may rewrite link text before React hydrates */}
              <span suppressHydrationWarning>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function mapLinks(
  links: readonly { label: string; href: string }[],
  locale: AppLocale,
): { label: string; href: string }[] {
  return links.map(({ label, href }) => ({
    href,
    label: footerLinkLabel(href, label, locale),
  }));
}

export default function SiteFooter() {
  const { locale } = useLocale();
  const mainLinks = useMemo(() => mapLinks(MAIN_LINKS, locale), [locale]);
  const growthLinks = useMemo(() => mapLinks(GROWTH_LINKS, locale), [locale]);
  const whoLinks = useMemo(() => mapLinks(WHO_WE_SERVE_LINKS, locale), [locale]);
  const legalLinks = useMemo(() => mapLinks(LEGAL_LINKS, locale), [locale]);
  const primaryCta = footerPrimaryCta(locale);
  const secondaryCta = footerSecondaryCta(locale);

  return (
    <footer
      className="mt-auto w-full min-w-0 max-w-full shrink-0 border-t border-border bg-section/80 dark:bg-section/40"
      aria-label={footerAriaLabel(locale)}
      suppressHydrationWarning
    >
      <div className="container mx-auto min-w-0 max-w-full px-3 py-10 pb-safe fold:px-4 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-10 sm:gap-12">
          <div className="flex flex-col gap-6 border-b border-border/80 pb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="min-w-0 space-y-2">
              <Link
                href="/"
                className="inline-block text-base font-semibold text-foreground hover:text-primary transition-colors"
              >
                Ascendra Technologies
              </Link>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{footerTagline(locale)}</p>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-3 xs:flex-row xs:flex-wrap">
              <Button asChild size="sm" className="min-h-[44px] gap-1.5 shadow-sm sm:min-h-9">
                <Link href={AUDIT_PATH}>
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {primaryCta}
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="min-h-[44px] border-border hover:bg-accent hover:text-accent-foreground sm:min-h-9"
              >
                <Link href={STRATEGY_CALL_PATH}>{secondaryCta}</Link>
              </Button>
            </div>
          </div>

          <nav
            className="grid min-w-0 grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-8"
            aria-label={footerNavAriaLabel(locale)}
            suppressHydrationWarning
          >
            <LinkGroup title={footerSectionTitle("main", locale)} links={mainLinks} />
            <LinkGroup title={footerSectionTitle("growth", locale)} links={growthLinks} />
            <LinkGroup title={footerSectionTitle("who", locale)} links={whoLinks} />
            <LinkGroup title={footerSectionTitle("legal", locale)} links={legalLinks} />
            <div className="flex min-w-0 flex-col gap-3 sm:col-span-2 lg:col-span-1 xl:col-span-1">
              <h3 className="border-b border-border/70 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {footerSectionTitle("contact", locale)}
              </h3>
              <address className="not-italic space-y-3 text-sm text-muted-foreground">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS.line)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-fit rounded-sm transition-colors hover:text-foreground"
                >
                  {COMPANY_ADDRESS.street}
                  <br />
                  {COMPANY_ADDRESS.city}, {COMPANY_ADDRESS.region} {COMPANY_ADDRESS.postalCode}
                  <br />
                  {COMPANY_ADDRESS.country}
                </a>
                <a
                  href={`tel:${COMPANY_PHONE_E164}`}
                  className="block w-fit rounded-sm transition-colors hover:text-foreground"
                >
                  {COMPANY_PHONE_DISPLAY}
                </a>
                <Link
                  href="/contact"
                  className="inline-flex w-fit text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline"
                >
                  {footerContactFormLink(locale)}
                </Link>
              </address>
            </div>
          </nav>

          <div className="flex flex-col-reverse gap-6 border-t border-border/80 pt-8 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {footerPartnershipLine(locale)}
              </p>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {footerCopyrightLine(locale, new Date().getFullYear())}
              </p>
            </div>
            <div className="flex-shrink-0 sm:pt-0.5">
              <FooterLanguageControl />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
