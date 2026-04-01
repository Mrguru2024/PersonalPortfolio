"use client";

import { useEffect } from "react";
import {
  absoluteFromSiteBase,
  getSiteBaseUrl,
  resolveClientSiteBase,
} from "@/lib/siteUrl";
import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE_E164 } from "@/lib/company";
import {
  updateJsonLdScript,
  updateLinkTag,
  updateMetaTag,
} from "@shared/seo-head";

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
    | "WebSite"
    | "AboutPage"
    | "ProfilePage"
    | "ContactPage"
    | "CollectionPage";
}

export function PageSEO({
  title,
  description,
  canonicalPath = "",
  keywords = [],
  ogType = "website",
  ogImage = "/og-ascendra.png",
  ogImageAlt = "Ascendra Technologies — Brand Growth",
  baseUrl = getSiteBaseUrl(),
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
    "brand growth",
    "website strategy",
    "conversion",
  ].join(", ");

  useEffect(() => {
    const resolvedBase = resolveClientSiteBase(baseUrl);
    const path =
      canonicalPath === "" || canonicalPath.startsWith("/")
        ? canonicalPath
        : `/${canonicalPath}`;
    const url = `${resolvedBase}${path}`;
    const ogImageAbsolute = absoluteFromSiteBase(resolvedBase, ogImage);

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
    updateMetaTag("og:site_name", COMPANY_NAME, true);
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", ogImageAbsolute, true);
    updateMetaTag("og:image:alt", ogImageAlt, true);

    // Twitter
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:url", url);
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", ogImageAbsolute);
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
          name: "Anthony MrGuru Feaster",
          url: resolvedBase,
        },
        publisher: {
          "@type": "Organization",
          name: COMPANY_NAME,
          url: resolvedBase,
          telephone: COMPANY_PHONE_E164,
          address: {
            "@type": "PostalAddress",
            streetAddress: COMPANY_ADDRESS.street,
            addressLocality: COMPANY_ADDRESS.city,
            addressRegion: COMPANY_ADDRESS.region,
            postalCode: COMPANY_ADDRESS.postalCode,
            addressCountry: "US",
          },
          logo: {
            "@type": "ImageObject",
            url: `${resolvedBase}/ascendra-logo.svg`,
            width: 512,
            height: 512,
          },
        },
      },
      "page-seo"
    );
  }, [
    fullTitle,
    description,
    keywordsString,
    canonicalPath,
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
