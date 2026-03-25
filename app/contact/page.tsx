import type { Metadata } from "next";
import { TrackPageView } from "@/components/TrackPageView";
import { ContactBookingSection } from "@/components/contact/ContactBookingSection";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Contact | Book a call | Ascendra Technologies",
  description:
    "Book a free call with the Brand Growth team to discuss your brand, design, or website goals.",
  path: "/contact",
  keywords: ["contact", "book a call", "brand growth", "Ascendra"],
});

export default function ContactPage() {
  return (
    <>
      <WebPageJsonLd
        title="Contact | Book a call | Ascendra Technologies"
        description="Book a free call with the Brand Growth team to discuss your brand, design, or website goals."
        path="/contact"
        schemaType="ContactPage"
      />
      <TrackPageView path="/contact" />
      <ContactBookingSection />
    </>
  );
}
