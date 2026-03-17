import { AdminGlobalTips } from "@/components/admin/AdminGlobalTips";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminGlobalTips />
      {children}
    </>
  );
}
