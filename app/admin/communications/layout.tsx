import { CommunicationsSubnav } from "@/components/communications/CommunicationsSubnav";

export default function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-6xl">
      <header className="mb-2 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ascendra OS</p>
        <h1 className="text-2xl font-bold tracking-tight">Email &amp; campaigns</h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Send polished email to people in your CRM, reuse designs across sends, and see opens and clicks alongside each
          contact. Delivery runs through Brevo; activity also appears on lead timelines so nothing lives in a silo.
        </p>
      </header>
      <CommunicationsSubnav />
      {children}
    </div>
  );
}
