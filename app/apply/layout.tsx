import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Your Growth Plan | Apply",
  description: "Share your details to get a tailored growth plan and follow-up.",
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
