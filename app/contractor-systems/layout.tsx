import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Contractor & Trades Website Lead System | Ascendra Technologies",
  description:
    "Turn your contractor or trades business website into a lead machine. Custom websites and automation for electricians, HVAC, plumbers, locksmiths, and local service businesses.",
  path: "/contractor-systems",
  keywords: [
    "contractor website",
    "trades business",
    "lead generation",
    "electrician website",
    "HVAC website",
    "plumber website",
    "local service business",
  ],
});

export default function ContractorSystemsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Contractor & Trades Website Lead System | Ascendra Technologies"
        description="Turn your contractor or trades business website into a lead machine. Custom websites and automation for electricians, HVAC, plumbers, locksmiths, and local service businesses."
        path="/contractor-systems"
      />
      {children}
    </>
  );
}
