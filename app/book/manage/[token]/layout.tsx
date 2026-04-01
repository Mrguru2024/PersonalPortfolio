import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Your booking | Ascendra",
  description: "View or cancel your scheduled meeting with Ascendra.",
  path: "/book/manage",
  noIndex: true,
});

export default function ManageBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
