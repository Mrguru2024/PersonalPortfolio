import type { Metadata } from "next";
import { PageSEO } from "@/components/SEO";
import { SchedulingBookFlow } from "@/components/scheduling/SchedulingBookFlow";

export const metadata: Metadata = {
  title: "Book a time | Ascendra Technologies",
  description: "Schedule a meeting with Ascendra—pick a type, date, and time. Confirmations and reminders are sent from Ascendra.",
};

export default function BookPage() {
  return (
    <>
      <PageSEO
        title="Book a time | Ascendra Technologies"
        description="Schedule directly with Ascendra: choose a meeting type, date, and time. You will receive email confirmation and reminders."
        canonicalPath="/book"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">Book a time</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Scheduling runs on Ascendra. You&apos;ll get email confirmation and optional reminders before we meet.
          </p>
          <SchedulingBookFlow />
        </div>
      </div>
    </>
  );
}
