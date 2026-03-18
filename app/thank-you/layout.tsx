import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank you | We'll be in touch",
  description: "We've received your application and will follow up shortly.",
};

export default function ThankYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
