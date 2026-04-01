import type { Metadata } from "next";
import { COMPANY_NAME } from "@/lib/company";
import { getSiteOriginForMetadata } from "@/lib/siteUrl";

export type MarketingOgType = "website" | "article";

export interface BuildMarketingMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
  ogType?: MarketingOgType;
}

/**
 * Public page title: mirrors legacy PageSEO — if "Ascendra" appears, do not append a suffix.
 */
export function marketingPageTitle(title: string): string {
  const t = title.trim();
  if (!t) return `${COMPANY_NAME}`;
  if (/ascendra/i.test(t)) return t;
  return `${t} | Ascendra Technologies`;
}

/**
 * Next.js Metadata for marketing URLs: canonical, Open Graph, Twitter, keywords, robots.
 */
export function buildMarketingMetadata(input: BuildMarketingMetadataInput): Metadata {
  const base = getSiteOriginForMetadata().replace(/\/$/, "");
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const canonical = `${base}${path}`;
  const fullTitle = marketingPageTitle(input.title);
  const ogImage = input.ogImage ?? "/og-ascendra.png";
  const ogImageAlt = input.ogImageAlt ?? `${COMPANY_NAME} — Brand Growth`;
  const keywords = [
    ...(input.keywords ?? []),
    "Ascendra Technologies",
    "brand growth",
    "website strategy",
    "conversion",
  ];
  const uniqueKeywords = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))];

  const metadata: Metadata = {
    title: fullTitle,
    description: input.description,
    keywords: uniqueKeywords,
    alternates: { canonical },
    openGraph: {
      type: input.ogType ?? "website",
      url: canonical,
      title: fullTitle,
      description: input.description,
      siteName: COMPANY_NAME,
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [ogImage],
    },
  };

  if (input.noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    };
  }

  return metadata;
}
