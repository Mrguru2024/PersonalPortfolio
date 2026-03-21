import { redirect } from "next/navigation";

/** Growth diagnosis admin UI lives in the unified Lead intake hub. */
export default function AdminGrowthDiagnosisRedirectPage() {
  redirect("/admin/lead-intake?tab=growth_diagnosis");
}
