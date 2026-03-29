import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminExperimentsLayout({ children }: { children: ReactNode }) {
  const nav = [
    { href: "/admin/experiments", label: "Overview" },
    { href: "/admin/experiments/new", label: "New experiment" },
    { href: "/admin/experiments/reports", label: "Reports" },
    { href: "/admin/experiments/patterns", label: "Patterns" },
  ];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ascendra Experimentation Engine</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Revenue experiments</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          One system for tests, tracking metadata, CRM outcomes, and paid media feedback. Extends{" "}
          <code className="text-xs bg-muted px-1 rounded">growth_experiments</code>,{" "}
          <code className="text-xs bg-muted px-1 rounded">visitor_activity</code>, and PPC CRM hooks — not a separate analytics product.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b pb-3">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {n.label}
          </Link>
        ))}
        <Link
          href="/admin/analytics"
          className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
        >
          Website analytics
        </Link>
      </nav>
      {children}
    </div>
  );
}
