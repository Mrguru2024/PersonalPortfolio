import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Growth Score | Diagnosis Results",
  description: "View your growth score, primary bottleneck, and recommended next step from your diagnosis.",
};

export default function DiagnosisResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
