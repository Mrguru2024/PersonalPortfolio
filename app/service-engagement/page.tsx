import type { Metadata } from "next";
import Link from "next/link";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { AscendraBehaviorMount } from "@/components/tracking/AscendraBehaviorMount";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Service engagement expectations | Ascendra",
  description:
    "Educational overview of how Ascendra scopes work—not a binding contract. A countersigned agreement, statement of work, or e-sign record (such as DocuSign) controls if there is any conflict.",
  path: "/service-engagement",
  keywords: ["terms", "scope", "Ascendra", "services", "disclaimer"],
});

const sections: { title: string; bullets: string[] }[] = [
  {
    title: "No guaranteed results",
    bullets: [
      "Marketing and growth outcomes depend on your market, offer, operations, budget, and follow-up. We describe work clearly; we do not promise rankings, lead counts, revenue, or ROAS.",
    ],
  },
  {
    title: "Your cooperation matters",
    bullets: [
      "Timely feedback, access to assets, truthful inputs, and sales follow-up affect outcomes. Delays or scope changes may shift timelines and fees.",
    ],
  },
  {
    title: "Ad spend and media",
    bullets: [
      "Unless a signed scope says otherwise, ad spend is paid to platforms (Google, Meta, etc.) directly by you or through a separate media arrangement—not buried silently in management fees.",
    ],
  },
  {
    title: "Third-party platforms",
    bullets: [
      "Outages, policy changes, disapprovals, or attribution gaps on third-party systems are outside Ascendra’s control. We help troubleshoot but cannot guarantee platform behavior.",
    ],
  },
  {
    title: "Payments",
    bullets: [
      "Setup and deposits are often non-refundable once work starts because capacity is reserved and deliverables begin. Recurring fees are billed per your statement of work.",
    ],
  },
  {
    title: "Scope, revisions, termination",
    bullets: [
      "Deliverables and revision rounds are defined in writing. Either party may terminate per the contract; fees earned and hours used to date are typically due unless the agreement states otherwise.",
    ],
  },
];

export default function ServiceEngagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <AscendraBehaviorMount />
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 max-w-3xl space-y-10">
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100 dark:border-amber-400/35 dark:bg-amber-500/15"
          role="note"
        >
          <p className="font-medium text-amber-950 dark:text-amber-50">Explanatory only until you have a countersigned agreement</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            Nothing on this page creates an obligation. A binding relationship exists only after a written agreement is fully
            executed—for example a service agreement countersigned by both parties or completed via an e-sign provider such as
            DocuSign—together with any statement of work referenced there.
          </p>
        </div>
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legal hygiene</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Service engagement expectations</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page summarizes common clauses for transparency—it is{" "}
            <strong className="text-foreground">not legal advice</strong> and{" "}
            <strong className="text-foreground">not a substitute</strong> for your signed or countersigned agreement. If there
            is a conflict, the executed contract, statement of work, and e-sign record control—not this overview.
          </p>
          <p className="text-sm">
            <Link href="/terms" className="underline text-primary">
              Terms of Service
            </Link>
          </p>
        </header>
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title} className="border-b border-border/80 pb-6 last:border-0">
              <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="text-xs text-muted-foreground border-t border-border pt-6">
          For a binding agreement, Ascendra provides a generated service summary for electronic signature on a dedicated link
          after scope is defined—often preceded by a strategy or discovery call. Your countersigned copy is the controlling
          record alongside any statement of work.
        </p>
      </div>
    </div>
  );
}
