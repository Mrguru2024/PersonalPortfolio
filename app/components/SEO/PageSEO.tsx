"use client";

import { useEffect } from "react";

interface PageSEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  keywords?: string[];
  ogType?: string;
  ogImage?: string;
  ogImageAlt?: string;
  baseUrl?: string;
  noIndex?: boolean;
  schemaType?:
    | "WebPage"
    | "AboutPage"
    | "ProfilePage"
    | "ContactPage"
    | "CollectionPage";
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
function updateJsonLdScript(data: object, id: string) {
  if (typeof document === "undefined") return;

  // Remove existing JSON-LD script for this page
  const existingScript = document.querySelector(
    `script[type="application/ld+json"][data-seo-id="${id}"]`
  );
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-seo-id", id);
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function PageSEO({
  title,
  description,
  canonicalPath = "",
  keywords = [],
  ogType = "website",
  ogImage = "/ascendra-logo.svg",
  ogImageAlt = "Ascendra Technologies",
  baseUrl = "https://mrguru.dev",
  noIndex = false,
  schemaType = "WebPage",
}: PageSEOProps) {
  const fullTitle = title.includes("Ascendra")
    ? title
    : `${title} | Ascendra Technologies`;
  const url = `${baseUrl}${canonicalPath}`;
  const keywordsString = [
    ...keywords,
    "Ascendra Technologies",
    "Anthony Feaster",
    "web developer",
    "portfolio",
  ].join(", ");

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Basic Meta Tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywordsString);

    if (noIndex) {
      updateMetaTag("robots", "noindex, nofollow");
    } else {
      // Remove noindex if it exists
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (
        robotsMeta &&
        robotsMeta.getAttribute("content") === "noindex, nofollow"
      ) {
        robotsMeta.remove();
      }
    }

    updateLinkTag("canonical", url);

    // Open Graph / Facebook
    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", `${baseUrl}${ogImage}`, true);
    updateMetaTag("og:image:alt", ogImageAlt, true);

    // Twitter
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:url", url);
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", `${baseUrl}${ogImage}`);
    updateMetaTag("twitter:image:alt", ogImageAlt);

    // Schema.org / JSON-LD
    updateJsonLdScript(
      {
        "@context": "https://schema.org",
        "@type": schemaType,
        name: fullTitle,
        description: description,
        url: url,
        author: {
          "@type": "Person",
          name: "Anthony Feaster",
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
      },
      "page-seo"
    );
  }, [
    fullTitle,
    description,
    keywordsString,
    url,
    ogType,
    ogImage,
    ogImageAlt,
    baseUrl,
    noIndex,
    schemaType,
  ]);

  // This component doesn't render anything visible
  return null;
}
