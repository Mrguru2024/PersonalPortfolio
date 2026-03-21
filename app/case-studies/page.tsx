import type { Metadata } from "next";
import { CaseStudiesListingClient } from "./CaseStudiesListingClient";

export const metadata: Metadata = {
  title: "Case Studies | Ascendra Technologies",
  description:
    "Proof-backed growth case studies across trades, freelancers, founders, and operators.",
  openGraph: {
    title: "Case Studies | Ascendra Technologies",
    description:
      "Explore proof-focused case studies and move from diagnosis to system-led conversion.",
  },
};

export default function CaseStudiesPage() {
  return <CaseStudiesListingClient />;
}
