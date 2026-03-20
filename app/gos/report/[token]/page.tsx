import { GosReportView } from "./GosReportView";

export const dynamic = "force-dynamic";

export default async function GosReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GosReportView token={token} />;
}
