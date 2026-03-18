import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Growth Results | Diagnosis complete",
  description: "View your growth score, primary bottleneck, and recommended next step.",
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
