import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client workspace | Ascendra Technologies",
  description:
    "Sign in for Ascendra clients — invoices, proposals, project updates, and feedback in one place.",
  robots: "noindex, nofollow",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
