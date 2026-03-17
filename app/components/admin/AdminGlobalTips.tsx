"use client";

import { usePathname } from "next/navigation";
import { AdminPlatformTips } from "./AdminPlatformTips";

/**
 * Derives the platform-tips section from the current admin path
 * so tips are contextual across the whole admin area.
 */
function getSectionFromPath(pathname: string): string {
  if (!pathname || !pathname.startsWith("/admin")) return "general";
  const p = pathname.replace(/^\/admin/, "").replace(/\/$/, "") || "/";
  if (p.startsWith("/crm/playbooks")) return "playbooks";
  if (p.startsWith("/crm/discovery")) return "discovery";
  if (p.startsWith("/crm/proposal-prep")) return "proposal-prep";
  if (p.startsWith("/crm/pipeline")) return "pipeline";
  if (p.startsWith("/crm/accounts") || p.startsWith("/crm/import") || p.startsWith("/crm/personas") || p.startsWith("/crm/sequences") || p.startsWith("/crm/saved-lists") || p.startsWith("/crm/tasks") || p.startsWith("/crm/dashboard")) return "contacts";
  if (p.startsWith("/crm") || p === "/crm") return "contacts"; // lead list, lead profile [id]
  if (p.startsWith("/dashboard") || p === "/" || p === "") return "dashboard";
  if (p.startsWith("/blog")) return "blog";
  if (p.startsWith("/newsletters")) return "newsletters";
  if (p.startsWith("/invoices")) return "invoices";
  return "general";
}

export function AdminGlobalTips() {
  const pathname = usePathname();
  const section = getSectionFromPath(pathname ?? "");

  return (
    <div className="mb-4">
      <AdminPlatformTips section={section} defaultOpen={false} />
    </div>
  );
}
