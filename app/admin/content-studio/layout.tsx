import type { Metadata } from "next";
import { ContentStudioShell } from "@/components/content-studio/ContentStudioShell";

export const metadata: Metadata = {
  title: "Content Studio | Admin",
  robots: { index: false, follow: false },
};

export default function ContentStudioLayout({ children }: { children: React.ReactNode }) {
  return <ContentStudioShell>{children}</ContentStudioShell>;
}
