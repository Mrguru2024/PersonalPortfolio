"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVisitorTracking } from "@/lib/useVisitorTracking";

interface TrackedCtaLinkProps {
  href: string;
  ctaLabel: string;
  pageVisited?: string;
  className?: string;
  /** Merged into tracking metadata (e.g. personaId for journey CTAs). */
  extraMetadata?: Record<string, unknown>;
  children: React.ReactNode;
}

/**
 * Link that fires cta_click before navigation. Use for primary CTAs (e.g. Start audit, Get my snapshot).
 */
export function TrackedCtaLink({
  href,
  ctaLabel,
  pageVisited,
  className,
  extraMetadata,
  children,
}: TrackedCtaLinkProps) {
  const pathname = usePathname();
  const { track } = useVisitorTracking();
  const page = pageVisited ?? pathname ?? "/";

  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        track("cta_click", {
          pageVisited: page,
          metadata: { cta: ctaLabel, ...extraMetadata },
        })
      }
    >
      {children}
    </Link>
  );
}
