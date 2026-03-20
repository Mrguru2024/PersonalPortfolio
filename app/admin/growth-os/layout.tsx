import type { Metadata } from "next";
import { GrowthOsAdminShell } from "@/components/growth-os/GrowthOsAdminShell";

export const metadata: Metadata = {
  title: "Growth OS | Admin",
  robots: { index: false, follow: false },
};

export default function GrowthOsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GrowthOsAdminShell>{children}</GrowthOsAdminShell>;
}
