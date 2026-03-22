import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Ascendra Technologies",
  description:
    "Clients, community members, and team: one Ascendra account—pick client workspace, community sign-in, or your internal dashboard.",
  robots: "noindex, nofollow",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
