import Home from "@/pages/Home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ascendra Technologies | Strategy, Design, Technology",
  description:
    "A coordinated growth ecosystem helping businesses improve brand clarity, presentation quality, website performance, and conversion systems.",
};

export default function HomePage() {
  return <Home />;
}
