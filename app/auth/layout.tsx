import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Ascendra Technologies",
  description: "Sign in to your Ascendra Technologies account to access the dashboard, CRM, and content management.",
  robots: "noindex, nofollow",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
