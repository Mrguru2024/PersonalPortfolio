import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Growth Diagnosis | Discover What's Slowing Your Business",
  description:
    "Get a personalized diagnosis across your brand, website, and lead system. Find your biggest bottleneck and the right next step.",
};

export default function GrowthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
