import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live site settings (super admin)",
  robots: { index: false, follow: false },
};

export default function AdminDeploymentEnvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
