import type { Metadata } from "next";
import MarketResearchProjectPage from "./project-page";

export const metadata: Metadata = {
  title: "Market Research Project | Growth OS",
  robots: { index: false, follow: false },
};

export default function MarketResearchProjectRoute() {
  return <MarketResearchProjectPage />;
}
