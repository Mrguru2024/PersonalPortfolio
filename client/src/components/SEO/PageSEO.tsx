import { useEffect } from "react";
import { applyDefaultClientSiteSeo } from "@shared/default-client-seo";
import {
  removeJsonLdScript,
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
    | "AboutPage"
    | "ProfilePage"
    | "ContactPage"
    | "CollectionPage";
}

const PAGE_JSON_LD_ID = "page-seo";

export function PageSEO({
  title,
  description,
  canonicalPath = "",
  keywords = [],
  ogType = "website",
  ogImage = "/images/mrguru-og-image.jpg",
  ogImageAlt = "Anthony MrGuru Feaster - Senior Full Stack Developer",
  baseUrl = "https://mrguru.dev",
  noIndex = false,
  schemaType = "WebPage",
}: PageSEOProps) {
  const fullTitle = title.includes("MrGuru.dev") ? title : `${title} | MrGuru.dev`;
  const url = `${baseUrl}${canonicalPath}`;
  const keywordsString = [
    ...keywords,
    "MrGuru",
    "Anthony MrGuru Feaster",
    "web developer",
    "portfolio",
  ].join(", ");

  useEffect(() => {
    document.title = fullTitle;

    updateMetaTag("description", description);
    updateMetaTag("keywords", keywordsString);

    if (noIndex) {
      updateMetaTag("robots", "noindex, nofollow");
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (
        robotsMeta &&
        robotsMeta.getAttribute("content") === "noindex, nofollow"
      ) {
        robotsMeta.remove();
      }
    }

    updateLinkTag("canonical", url);

    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", `${baseUrl}${ogImage}`, true);
    updateMetaTag("og:image:alt", ogImageAlt, true);

    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:url", url);
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", `${baseUrl}${ogImage}`);
    updateMetaTag("twitter:image:alt", ogImageAlt);

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
          name: "Ascendra Technologies",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/favicon-32x32.png`,
            width: 32,
            height: 32,
          },
        },
      },
      PAGE_JSON_LD_ID,
    );

    return () => {
      removeJsonLdScript(PAGE_JSON_LD_ID);
      applyDefaultClientSiteSeo();
    };
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

  return null;
}
