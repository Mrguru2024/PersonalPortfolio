import { CommunicationsSubnav } from "@/components/communications/CommunicationsSubnav";

export default function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ascendra OS</p>
        <h1 className="text-2xl font-bold tracking-tight">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          CRM-linked email campaigns, templates, and engagement — Brevo outbound, shared tracking with CRM timelines.
        </p>
      </div>
      <CommunicationsSubnav />
      {children}
    </div>
  );
}
