import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailHubSidebar } from "@/components/email-hub/EmailHubSidebar";

export default function EmailHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="container max-w-7xl mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-1" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <span className="text-muted-foreground/50 hidden sm:inline">|</span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/communications">Communications (campaigns)</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/crm">CRM</Link>
          </Button>
        </div>
        <header className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ascendra OS</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Email Hub</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
            Polished outbound email built on Brevo — compose, templates, brand assets, scheduling, and tracking.
            Campaign broadcasts stay under{" "}
            <Link href="/admin/communications" className="text-primary underline-offset-2 hover:underline">
              Communications
            </Link>
            .
          </p>
        </header>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <EmailHubSidebar />
          <div className="flex-1 min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
