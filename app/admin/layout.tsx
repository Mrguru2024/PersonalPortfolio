import { AdminGlobalTips } from "@/components/admin/AdminGlobalTips";
import { AdminAgentWidget } from "@/components/admin/AdminAgentWidget";
import { AdminMentorCompanion } from "@/components/admin/AdminMentorCompanion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminGlobalTips />
      <AdminMentorCompanion />
      {children}
      <AdminAgentWidget />
    </>
  );
}
