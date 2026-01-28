"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

/**
 * ClickTracker - Tracks clicks on links and interactive elements in blog posts
 * Sends click events to analytics API for engagement tracking
 */
export function ClickTracker() {
  const params = useParams();
  const slug = params?.slug as string;
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!slug || typeof globalThis === "undefined" || !globalThis.window) return;

    const trackClick = async (element: HTMLElement, type: string) => {
      const href = element.getAttribute("href");
      const text = element.textContent?.trim() || "";
      const identifier = `${type}-${href || text}`;

      // Avoid duplicate tracking
      if (trackedRef.current.has(identifier)) return;
      trackedRef.current.add(identifier);

      try {
        await fetch(`/api/blog/${slug}/analytics/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type, // 'internal_link', 'external_link', 'share_button', etc.
            href: href || null,
            text: text.substring(0, 100), // Limit text length
            element: element.tagName.toLowerCase(),
          }),
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.debug("Click tracking error:", error);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Track internal links
      const link = target.closest("a[href^='/'], a[href^='http']");
      if (link) {
        const href = (link as HTMLAnchorElement).href;
        if (href.includes(globalThis.location.hostname) || href.startsWith("/")) {
          trackClick(link as HTMLElement, "internal_link");
        } else {
          trackClick(link as HTMLElement, "external_link");
        }
      }

      // Track share buttons
      const shareButton = target.closest("[data-share-platform]");
      if (shareButton) {
        const platform = (shareButton as HTMLElement).dataset.sharePlatform;
        if (platform) {
          trackClick(shareButton as HTMLElement, `share_${platform}`);
        }
      }

      // Track copy link button
      const copyButton = target.closest("[data-action='copy-link']");
      if (copyButton) {
        trackClick(copyButton as HTMLElement, "copy_link");
      }
    };

    // Add click listener to document
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [slug]);

  return null; // This component doesn't render anything
}
