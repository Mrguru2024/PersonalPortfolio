import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ascendra Founder Network | Community for Founders & Builders",
  description:
    "Join a premium community of startup founders, small business owners, and builders. Connect, collaborate, and grow with Ascendra Founder Network.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
