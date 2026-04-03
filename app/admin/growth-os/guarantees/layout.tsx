import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client guarantees | Growth OS",
  robots: { index: false, follow: false },
};

export default function GrowthOsGuaranteesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
