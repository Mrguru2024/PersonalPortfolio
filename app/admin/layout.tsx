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
      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        {children}
      </div>
      <AdminAgentWidget />
    </>
  );
}
