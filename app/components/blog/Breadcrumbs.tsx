"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component for SEO and navigation
 * Provides structured navigation and helps search engines understand site hierarchy
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const allItems = [
    { label: "Home", href: "/" },
    ...items,
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground mb-6", className)}
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        return (
          <div key={item.href} className="flex items-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            {index === 0 ? (
              <Link
                href={item.href}
                className="flex items-center hover:text-foreground transition-colors"
                itemProp="item"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only" itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                {isLast ? (
                  <span className="text-foreground font-medium" itemProp="name">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                    itemProp="item"
                  >
                    <span itemProp="name">{item.label}</span>
                  </Link>
                )}
              </>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </div>
        );
      })}
    </nav>
  );
}
