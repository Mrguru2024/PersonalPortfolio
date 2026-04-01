import type { Metadata } from "next";
import { OperationsDashboardClient } from "./OperationsDashboardClient";

export const metadata: Metadata = {
  title: "Ascendra Operations Dashboard | Admin",
  robots: { index: false, follow: false },
};

export default function OperationsDashboardPage() {
  return <OperationsDashboardClient />;
}
