import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ExperimentsSubnav } from "@/components/aee/ExperimentsSubnav";

export default function AdminExperimentsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto min-w-0 max-w-7xl px-3 fold:px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ascendra Experimentation Engine
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Revenue experiments</h1>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          One hub for A/B and multivariate tests, tracking metadata, CRM outcomes, and paid media feedback. Built on{" "}
          <code className="text-xs bg-muted px-1 rounded">growth_experiments</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">visitor_activity</code>, and PPC CRM hooks — not a separate
          analytics product.
        </p>
        <p className="text-sm pt-1">
          <Link
            href="/admin/how-to/experiments"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4"
          >
            <BookOpen className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Interactive tutorial: how A/B testing works here
          </Link>
        </p>
      </header>

      <ExperimentsSubnav />

      {children}
    </div>
  );
}
