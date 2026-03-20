import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report | Ascendra",
  robots: { index: false, follow: false },
};

export default function GosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
