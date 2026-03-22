import type { Metadata } from "next";
import { TrackPageView } from "@/components/TrackPageView";
import { ContactBookingSection } from "@/components/contact/ContactBookingSection";

export const metadata: Metadata = {
  title: "Contact | Book a call | Ascendra Technologies",
  description:
    "Book a free call with the Brand Growth team to discuss your brand, design, or website goals.",
};

export default function ContactPage() {
  return (
    <>
      <TrackPageView path="/contact" />
      <ContactBookingSection />
    </>
  );
}
