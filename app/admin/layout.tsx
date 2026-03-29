import { AdminGlobalTips } from "@/components/admin/AdminGlobalTips";
import { AdminAgentWidget } from "@/components/admin/AdminAgentWidget";
import { AdminTooltipBoundary } from "@/components/admin/AdminTooltipBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminTooltipBoundary>
        <AdminGlobalTips />
        {children}
      </AdminTooltipBoundary>
      <AdminAgentWidget />
    </>
  );
}
