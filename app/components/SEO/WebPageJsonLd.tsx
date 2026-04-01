import { COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE_E164 } from "@/lib/company";
import { getSiteOriginForMetadata } from "@/lib/siteUrl";
import { marketingPageTitle } from "@/lib/marketingMetadata";

export type WebPageSchemaType =
  | "WebPage"
  | "WebSite"
  | "AboutPage"
  | "ProfilePage"
  | "ContactPage"
  | "CollectionPage"
  | "Article";

interface WebPageJsonLdProps {
  /** Same raw title string passed to buildMarketingMetadata (before suffix rules). */
  title: string;
  description: string;
  path: string;
  schemaType?: WebPageSchemaType;
}

/**
 * Server-rendered JSON-LD so crawlers see structured data without waiting for client JS.
 */
export function WebPageJsonLd({
  title,
  description,
  path,
  schemaType = "WebPage",
}: WebPageJsonLdProps) {
  const base = getSiteOriginForMetadata().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${p}`;
  const fullTitle = marketingPageTitle(title);

  const data = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: fullTitle,
    description,
    url,
    author: {
      "@type": "Person",
      name: "Anthony MrGuru Feaster",
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: COMPANY_NAME,
      url: base,
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
        url: `${base}/ascendra-logo.svg`,
        width: 512,
        height: 512,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
