"use client";

import { useEffect } from "react";
import { getSiteBaseUrl } from "@/lib/siteUrl";
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
          name: "Anthony MrGuru Feaster",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: COMPANY_NAME,
          url: baseUrl,
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
