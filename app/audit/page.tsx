import { redirect } from "next/navigation";

/** Legacy path: redirect to canonical Digital Growth Audit lead magnet. */
export default function AuditPage() {
  redirect("/digital-growth-audit");
}
