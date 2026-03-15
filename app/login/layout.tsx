import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client login | Ascendra Technologies",
  description: "Sign in to view your dashboard, proposals, invoices, and project updates.",
  robots: "noindex, nofollow",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
