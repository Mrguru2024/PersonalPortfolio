import { AdminGlobalTips } from "@/components/admin/AdminGlobalTips";
import { AdminAgentWidget } from "@/components/admin/AdminAgentWidget";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminGlobalTips />
      {children}
      <AdminAgentWidget />
    </>
  );
}
