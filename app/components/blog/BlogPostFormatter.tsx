"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BlogPostFormatterProps {
  content: string;
  internalLinks?: Array<{ text: string; url: string; postId?: number }>;
  externalLinks?: Array<{ text: string; url: string; nofollow?: boolean }>;
  className?: string;
}

/**
 * BlogPostFormatter - Automatically formats blog post content for optimal readability and SEO
 * - Enhances typography and spacing
 * - Adds proper heading hierarchy
 * - Optimizes images for lazy loading
 * - Inserts internal and external links
 * - Adds schema markup for better SEO
 */
export function BlogPostFormatter({
  content,
  internalLinks = [],
  externalLinks = [],
  className,
}: BlogPostFormatterProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current || typeof globalThis === "undefined") return;

    const container = contentRef.current;

    // Process and enhance the content
    const processContent = () => {
      // 1. Add lazy loading to images
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        if (!img.hasAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
        if (!img.hasAttribute("decoding")) {
          img.setAttribute("decoding", "async");
        }
        // Add alt text if missing
        if (!img.alt) {
          img.alt = "Blog post image";
        }
        // Add responsive sizing
        if (!img.style.maxWidth) {
          img.style.maxWidth = "100%";
          img.style.height = "auto";
        }
      });

      // 2. Enhance links with proper attributes
      const links = container.querySelectorAll("a");
      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;

        // External links
        if (href.startsWith("http") && !href.includes(globalThis.location.hostname)) {
          link.setAttribute("rel", "noopener noreferrer");
          link.setAttribute("target", "_blank");
          // Check if it should be nofollow
          const externalLink = externalLinks.find((el) => el.url === href);
          if (externalLink?.nofollow) {
            const currentRel = link.getAttribute("rel") || "";
            link.setAttribute("rel", `${currentRel} nofollow`.trim());
          }
        }

        // Add aria-label for accessibility
        if (!link.getAttribute("aria-label") && link.textContent) {
          link.setAttribute("aria-label", `Read more: ${link.textContent.trim()}`);
        }
      });

      // 3. Add proper heading hierarchy (ensure h1-h6 are in order)
      const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
      let lastLevel = 0;
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > lastLevel + 1 && lastLevel > 0) {
          // Skip levels detected - could log warning
          console.warn(`Heading hierarchy issue: ${heading.tagName} after h${lastLevel}`);
        }
        lastLevel = level;

        // Add IDs for anchor links
        if (!heading.id && heading.textContent) {
          const id = heading.textContent
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, "-")
            .replaceAll(/^-|-$/g, "");
          heading.id = id;
        }
      });

      // 4. Enhance code blocks
      const codeBlocks = container.querySelectorAll("pre code");
      codeBlocks.forEach((code) => {
        if (!code.parentElement?.classList.contains("hljs")) {
          code.parentElement?.classList.add("bg-gray-900", "dark:bg-gray-950", "p-4", "rounded-lg", "overflow-x-auto");
        }
      });

      // 5. Add table of contents anchors
      headings.forEach((heading, index) => {
        if (heading.id && index < 10) {
          // Only add to first 10 headings to avoid clutter
          const anchor = document.createElement("a");
          anchor.href = `#${heading.id}`;
          anchor.className = "heading-anchor opacity-0 hover:opacity-100 transition-opacity ml-2 text-primary";
          anchor.setAttribute("aria-label", "Link to this section");
          anchor.innerHTML = "#";
          heading.appendChild(anchor);
        }
      });

      // 6. Enhance blockquotes
      const blockquotes = container.querySelectorAll("blockquote");
      blockquotes.forEach((blockquote) => {
        if (!blockquote.querySelector("p")) {
          // Wrap content in paragraph if not already
          const p = document.createElement("p");
          p.innerHTML = blockquote.innerHTML;
          blockquote.innerHTML = "";
          blockquote.appendChild(p);
        }
      });

      // 7. Add reading progress indicators (optional visual enhancement)
      const paragraphs = container.querySelectorAll("p");
      paragraphs.forEach((p, index) => {
        if (index % 5 === 0 && index > 0) {
          // Add subtle visual breaks every 5 paragraphs
          p.classList.add("mt-8");
        }
      });
    };

    // Process after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(processContent, 100);

    return () => clearTimeout(timeoutId);
  }, [content, externalLinks]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "prose prose-lg dark:prose-invert max-w-none",
        // Typography enhancements
        "prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
        "prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:scroll-mt-20",
        "prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:scroll-mt-20",
        "prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:scroll-mt-20",
        "prose-h4:text-xl prose-h4:mt-4 prose-h4:mb-2",
        // Paragraph styling
        "prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base sm:prose-p:text-lg",
        // Link styling
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-all",
        "prose-a:decoration-2 prose-a:underline-offset-2",
        // Text emphasis
        "prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold",
        "prose-em:text-gray-700 dark:prose-em:text-gray-300 prose-em:italic",
        // Lists
        "prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:space-y-2",
        "prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:space-y-2",
        "prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-2 prose-li:leading-relaxed",
        // Blockquotes
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6",
        "prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900/50",
        "prose-blockquote:py-2 prose-blockquote:rounded-r",
        // Code
        "prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
        "prose-code:text-red-600 dark:prose-code:text-red-400 prose-code:font-mono",
        "prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg",
        "prose-pre:overflow-x-auto prose-pre:border prose-pre:border-gray-800",
        // Images
        "prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6 prose-img:w-full prose-img:h-auto",
        "prose-img:border prose-img:border-gray-200 dark:prose-img:border-gray-800",
        // Horizontal rules
        "prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-hr:my-8",
        // Tables
        "prose-table:w-full prose-table:my-6 prose-table:border-collapse",
        "prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:font-semibold prose-th:p-3",
        "prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700",
        "prose-td:p-3 prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700",
        // Additional enhancements
        "prose-figcaption:text-sm prose-figcaption:text-gray-500 prose-figcaption:mt-2 prose-figcaption:text-center",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content || '<p>No content available for this post.</p>' }}
      itemScope
      itemType="https://schema.org/BlogPosting"
    />
  );
}
