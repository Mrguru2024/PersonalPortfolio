import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaidGrowthReadinessGuidePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>PPC readiness (Ascendra)</CardTitle>
          <CardDescription>
            Complements the public{" "}
            <Link className="underline" href="/growth-diagnosis">
              Growth Diagnosis
            </Link>{" "}
            crawl — this checklist gates paid launch inside the OS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Hard gates before publish: linked ad account, valid offer, concrete landing path, at least two of GTM / Meta
            pixel / GA, Brevo CRM routing, linked Communications campaign, and readiness score ≥ 60. Meta dashboard publish
            supports objectives <strong>traffic</strong> and <strong>leads</strong> only; Google Ads dashboard publish is
            blocked.
          </p>
          <p>
            Categories scored: offer clarity, landing path, tracking env, CRM path, communications follow-up, proof on offer,
            budget, creative copy, UTM completeness. If any gate fails or score is below threshold, the account is marked{" "}
            <strong>Not ad ready</strong> and <strong>Foundation</strong> is the required next step until remediation is
            complete.
          </p>
          <p>
            When all gates pass: <strong>Launch</strong> (score 60–71) or <strong>Revenue Engine</strong> (72+).{" "}
            <strong>Foundation</strong> is the required path whenever gates fail or the account is not ad-ready.
          </p>
          <p>
            Deep site audits: keep using saved <Link href="/admin/internal-audit">funnel audit</Link> and diagnosis
            reports — do not duplicate those engines here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
