import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Growth Diagnosis | Answer a few questions",
  description: "Answer questions across brand, design, and systems to get your growth score and recommendation.",
};

export default function DiagnosisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
