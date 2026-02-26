"use client";

import { useEffect } from "react";
import type { BlogPost } from "@/lib/data";

interface BlogPostSEOProps {
  post: BlogPost;
  baseUrl?: string;
}

// Helper function to update or create meta tag
function updateMetaTag(property: string, content: string, isProperty = false) {
  if (typeof document === "undefined") return;

  const attribute = isProperty ? "property" : "name";
  let element = document.querySelector(
    `meta[${attribute}="${property}"]`
  ) as HTMLMetaElement;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, property);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

// Helper function to update or create link tag
function updateLinkTag(rel: string, href: string) {
  if (typeof document === "undefined") return;

  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

// Helper function to update or create script tag for JSON-LD
function updateJsonLdScript(data: object) {
  if (typeof document === "undefined") return;

  // Remove existing JSON-LD script for this page
  const existingScript = document.querySelector(
    'script[type="application/ld+json"][data-blog-post]'
  );
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-blog-post", "true");
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function BlogPostSEO({
  post,
  baseUrl = "https://mrguru.dev",
}: BlogPostSEOProps) {
  // Ensure slug exists
  const slug = post.slug || "";
  const postUrl = `${baseUrl}/blog/${slug}`;

  // Use SEO fields if available, otherwise fallback to defaults
  const metaTitle = (post as any).metaTitle || post.title || "Blog Post";
  const metaDescription = (post as any).metaDescription || post.summary || "";
  const ogTitle = (post as any).ogTitle || metaTitle;
  const ogDescription = (post as any).ogDescription || metaDescription;
  const ogImage =
    (post as any).ogImage || post.coverImage || `${baseUrl}/ascendra-logo.svg`;
  const canonicalUrl = (post as any).canonicalUrl || postUrl;
  const twitterCard = (post as any).twitterCard || "summary_large_image";

  // Extract plain text from HTML content for description (first 160 chars) if meta description not set
  const plainTextDescription =
    !metaDescription && post.content
      ? post.content
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .trim()
          .substring(0, 160) + "..."
      : "";

  // Use meta description, summary, extracted text, or fallback
  const description =
    metaDescription ||
    post.summary ||
    plainTextDescription ||
    "Read this blog post on Ascendra Technologies";

  // Format publish date for schema
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date().toISOString();
  const modifiedDate = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishDate;

  // Extract keywords - use SEO keywords if available, otherwise use tags
  const seoKeywords =
    (post as any).keywords && Array.isArray((post as any).keywords)
      ? (post as any).keywords
      : post.tags && Array.isArray(post.tags)
      ? post.tags
      : [];
  const keywords =
    seoKeywords.length > 0
      ? seoKeywords.join(", ")
      : typeof post.tags === "string"
      ? post.tags
      : "";

  // Ensure title is always a string
  const title = metaTitle;
  const safeTitle = `${title} | Ascendra Technologies Blog`;

  useEffect(() => {
    // Update document title
    document.title = safeTitle;

    // Basic Meta Tags
    updateMetaTag("description", description);
    updateMetaTag(
      "keywords",
      keywords
        ? `${keywords}, Ascendra Technologies, Anthony MrGuru Feaster, blog, web development`
        : "Ascendra Technologies, Anthony MrGuru Feaster, blog, web development"
    );
    updateLinkTag("canonical", canonicalUrl);

    // Open Graph / Facebook
    updateMetaTag("og:type", "article", true);
    updateMetaTag("og:url", postUrl, true);
    updateMetaTag("og:title", ogTitle, true);
    updateMetaTag("og:description", ogDescription, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("article:published_time", publishDate, true);
    updateMetaTag("article:modified_time", modifiedDate, true);

    // Add article tags
    const tagsToUse =
      seoKeywords.length > 0
        ? seoKeywords
        : post.tags && Array.isArray(post.tags)
        ? post.tags
        : [];
    if (tagsToUse.length > 0) {
      // Remove existing article:tag meta tags
      const existingTags = document.querySelectorAll(
        'meta[property^="article:tag"]'
      );
      existingTags.forEach((tag) => tag.remove());

      // Add new article:tag meta tags
      tagsToUse.forEach((tag: string) => {
        updateMetaTag("article:tag", tag, true);
      });
    }

    // Twitter
    updateMetaTag("twitter:card", twitterCard);
    updateMetaTag("twitter:url", postUrl);
    updateMetaTag("twitter:title", ogTitle);
    updateMetaTag("twitter:description", ogDescription);
    updateMetaTag("twitter:image", ogImage);

    // Schema.org / JSON-LD
    updateJsonLdScript({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: ogTitle,
      description: description,
      image: ogImage,
      url: postUrl,
      datePublished: publishDate,
      dateModified: modifiedDate,
      keywords:
        keywords ||
        "Ascendra Technologies, Anthony MrGuru Feaster, blog, web development",
      author: {
        "@type": "Person",
        name: "Anthony MrGuru Feaster",
        url: baseUrl,
      },
      publisher: {
        "@type": "Organization",
        name: "Ascendra Technologies",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/favicon.svg`,
          width: 32,
          height: 32,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": postUrl,
      },
    });

    // Cleanup function to restore default title when component unmounts
    return () => {
      document.title = "Ascendra Technologies | Portfolio & Blog";
    };
  }, [
    safeTitle,
    description,
    keywords,
    postUrl,
    ogTitle,
    ogImage,
    publishDate,
    modifiedDate,
    seoKeywords,
    baseUrl,
    canonicalUrl,
    twitterCard,
  ]);

  // This component doesn't render anything visible
  return null;
}
