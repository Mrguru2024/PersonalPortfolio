import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Ascendra Technologies",
  description: "Terms of Service for using Ascendra Technologies website and services.",
};

const COMPANY = "Ascendra Technologies";

export default function TermsPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
                Terms of Service
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
                These Terms of Service (&quot;Terms&quot;) govern your use of the website and services offered by {COMPANY}. By using our site or services, you agree to these Terms.
              </p>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  1. Acceptance of terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using our website, tools, forms, or any related services, you agree to be bound by these Terms. If you do not agree, please do not use our services.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  2. Use of the service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You may use our website and services only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the service.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                  <li>Do not submit false or misleading information.</li>
                  <li>Do not attempt to gain unauthorized access to our systems or other users&apos; data.</li>
                  <li>Do not use our services to distribute malware or spam.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  3. Accounts and information
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  When you create an account or submit forms (e.g., contact, audit, strategy call), you agree to provide accurate information. You are responsible for keeping your account credentials secure and for all activity under your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  4. Intellectual property
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The content, design, and materials on this website (including text, graphics, logos, and software) are owned by {COMPANY} or our licensors. You may not copy, modify, or distribute them without our written permission.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  5. Disclaimers
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our website and services are provided &quot;as is.&quot; We do not guarantee that the site will be error-free or uninterrupted. Advice and tools (e.g., audits, assessments) are for general guidance only and do not replace professional advice tailored to your situation.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  6. Limitation of liability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the fullest extent permitted by law, {COMPANY} and its partners shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or services.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  7. Changes to these terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms from time to time. We will post the revised Terms on this page and update the &quot;Last updated&quot; date. Continued use of our services after changes means you accept the updated Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  8. Contact
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Questions about these Terms? Contact us at{" "}
                  <Link href="/contact" className="text-primary hover:underline font-medium">
                    our contact page
                  </Link>
                  .
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/privacy">Privacy Policy</Link>
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
