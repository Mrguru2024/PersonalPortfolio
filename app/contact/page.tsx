import type { Metadata } from "next";
import { TrackPageView } from "@/components/TrackPageView";
import { ContactBookingSection } from "@/components/contact/ContactBookingSection";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { MARKETING_CTA_BOOK_STRATEGY_CALL } from "@shared/marketingCtaCopy";

const contactTitle = "Contact | Ascendra Technologies";
const contactDescription = `Message the Brand Growth team about brand, design, or website goals. Prefer a live working session? ${MARKETING_CTA_BOOK_STRATEGY_CALL} from the site menu.`;

export const metadata: Metadata = buildMarketingMetadata({
  title: contactTitle,
  description: contactDescription,
  path: "/contact",
  keywords: ["contact", "brand growth", "Ascendra", "strategy call"],
});

export default function ContactPage() {
  return (
    <>
      <WebPageJsonLd title={contactTitle} description={contactDescription} path="/contact" schemaType="ContactPage" />
      <TrackPageView path="/contact" />
      <ContactBookingSection />
    </>
  );
}
