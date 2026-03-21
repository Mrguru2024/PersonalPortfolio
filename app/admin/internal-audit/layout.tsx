import type { Metadata } from "next";
import { InternalAuditShell } from "@/components/internal-audit/InternalAuditShell";

export const metadata: Metadata = {
  title: "Website funnel audit | Admin",
  robots: { index: false, follow: false },
};

export default function InternalAuditLayout({ children }: { children: React.ReactNode }) {
  return <InternalAuditShell>{children}</InternalAuditShell>;
}
