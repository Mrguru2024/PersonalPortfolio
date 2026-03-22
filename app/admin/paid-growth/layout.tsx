import { PaidGrowthSubnav } from "@/components/paid-growth/PaidGrowthSubnav";

export default function PaidGrowthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ascendra OS</p>
        <h1 className="text-2xl font-bold tracking-tight">Paid Growth</h1>
        <p className="text-sm text-muted-foreground mt-1">
          PPC readiness, campaign drafts, Meta/Google connections, CRM + Communications handoff — integrated with offers and
          funnels (no duplicate engines).
        </p>
      </div>
      <PaidGrowthSubnav />
      {children}
    </div>
  );
}
