import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request data deletion | Ascendra Technologies",
  description: "Request removal of your personal data from Ascendra Technologies in line with our Privacy Policy.",
};

export default function DataDeletionRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
