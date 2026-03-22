import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your growth path | Ascendra Technologies",
  description:
    "Tell us what you run and what you need to fix — get a tailored path to lead magnets, services, and booking.",
  openGraph: {
    title: "Your growth path | Ascendra Technologies",
    description:
      "Persona-based journey: lead generation, conversion systems, and automation — matched to your business.",
  },
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
