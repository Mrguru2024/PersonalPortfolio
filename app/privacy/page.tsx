import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Ascendra Technologies",
  description: "How Ascendra Technologies collects, uses, and protects your personal information.",
};

const COMPANY = "Ascendra Technologies";

export default function PrivacyPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Shield className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
                Privacy Policy
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: March 2025
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-fit">
              <Link href="/" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </div>

          <Card className="border-border bg-card">
            <CardContent className="p-6 sm:p-8 space-y-8 text-sm sm:text-base text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                {COMPANY} respects your privacy. This policy explains what information we collect, how we use it, and how we protect it when you use our website and services.
              </p>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  1. Information we collect
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may collect information you provide directly and information we get from your use of our site.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li><strong className="text-foreground">You give us:</strong> name, email, phone, company, and other details when you fill out contact forms, audit requests, strategy-call forms, or assessments.</li>
                  <li><strong className="text-foreground">We collect automatically:</strong> general location (e.g., country or region from your browser or host), device type, and how you use our pages (e.g., which pages you visit) to improve our site and analytics.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  2. How we use your information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li>Respond to your requests (e.g., contact, audit, strategy call).</li>
                  <li>Send you follow-up or marketing communications only if you have agreed.</li>
                  <li>Improve our website, tools, and services.</li>
                  <li>Understand how visitors use our site (e.g., traffic and demographics in aggregate).</li>
                  <li>Comply with legal obligations or protect our rights.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  3. Cookies and similar technologies
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may use cookies and similar technologies to remember your preferences, keep you signed in, and analyze site traffic. You can control cookies through your browser settings.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  4. Sharing your information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal information. We may share it only with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li>Service providers who help us run our site and communications (e.g., hosting, email) under strict confidentiality.</li>
                  <li>Authorities when required by law or to protect our rights and safety.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  5. Data security
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use reasonable technical and organizational measures to protect your data against unauthorized access, loss, or misuse. No method of transmission over the internet is 100% secure; we strive to protect your information in line with industry practice.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  6. Your rights
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Depending on where you live, you may have the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li>Access or receive a copy of the personal data we hold about you.</li>
                  <li>Correct inaccurate data.</li>
                  <li>Request deletion of your data.</li>
                  <li>Object to or restrict certain processing.</li>
                  <li>Withdraw consent where we rely on it.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed pt-2">
                  To exercise these rights or ask questions, contact us via the link below.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  7. Changes to this policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the &quot;Last updated&quot; date. We encourage you to review it periodically.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  8. Contact us
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  For privacy-related questions or to exercise your rights, please use our{" "}
                  <Link href="/contact" className="text-primary hover:underline font-medium">
                    contact page
                  </Link>
                  . To request deletion of your data, use our{" "}
                  <Link href="/data-deletion-request" className="text-primary hover:underline font-medium">
                    data deletion request form
                  </Link>
                  .
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/terms">Terms of Service</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
