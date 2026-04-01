"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Calendar, ArrowRight, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  normalizeThankYouFormId,
  STRATEGY_CALL_PREP_CHECKLIST,
  THANK_YOU_SESSION,
  type ThankYouFormId,
} from "@/lib/funnelThankYou";
import { BRAND_GROWTH_PATH } from "@/lib/funnelCtas";

type SessionExtras = {
  bookingManageHref: string | null;
  bookingEmailSent: boolean | null;
  resumeDownloadUrl: string | null;
};

function copyForForm(form: ThankYouFormId): {
  title: string;
  body: string;
  bullets?: string[];
} {
  switch (form) {
    case "digital_growth_audit":
      return {
        title: "Your audit request is in",
        body: "We will review your information across strategy, design, and technology, then send recommended next steps.",
        bullets: [
          "We review your request and match you with the right next step.",
          "Expect follow-up within a few business days.",
          "You can book a call anytime if you prefer to talk first.",
        ],
      };
    case "strategy_call_contact":
      return {
        title: "Strategy call request received",
        body: "We will review your context and reach out with the best next-step call flow for your stage.",
        bullets: [
          "We’ll email you when we’re ready to schedule.",
          "No obligation — the call is about fit and clarity.",
        ],
      };
    case "strategy_call_landing":
      return {
        title: "You’re on the list",
        body: "Thanks for requesting a strategy call. We’ll reach out shortly to find a time that works for you.",
        bullets: [
          "We’ll email you within 24–48 hours to pick a time.",
          "You’ll get a short prep list so the call is productive.",
          "On the call: your goals, our approach, and clear next steps — no pressure.",
        ],
      };
    case "competitor_snapshot":
      return {
        title: "Snapshot request received",
        body: "We’ll use your details to prepare a structured competitor position review and follow up by email.",
        bullets: [
          "We review brand clarity, trust, and conversion readiness.",
          "This is a guided review — not automated scraping.",
        ],
      };
    case "growth_plan_apply":
      return {
        title: "Thank you — your growth plan request is in",
        body: "We’ve received your application and diagnosis context. Check your email for a summary; we’ll follow up within 1–2 business days.",
        bullets: [
          "We’ll review your responses and match you with the right next step.",
          "Someone from the team will follow up shortly.",
        ],
      };
    case "ppc_lead_consultation":
      return {
        title: "Your PPC & lead-system request is in",
        body: "We’ve received your goals around prospecting, CRM, conversion, and ads. We’ll review your context and follow up with a clear next step.",
        bullets: [
          "We match you to the right build, integration, or management path.",
          "Expect follow-up within a few business days.",
          "Book a call anytime if you prefer to talk through it live.",
        ],
      };
    case "native_booking":
      return {
        title: "You’re booked",
        body: "Your meeting is saved. Check your email for confirmation and calendar details when available.",
      };
    case "resume_request":
      return {
        title: "Request received",
        body: "Thanks — your resume access request went through. Use the button below if your download is ready.",
      };
    case "data_deletion":
      return {
        title: "Data deletion request received",
        body: "We have received your request and will process it in line with our Privacy Policy. We’ll contact you at the email you provided when it’s complete.",
      };
    default:
      return {
        title: "Thank you",
        body: "We’ve received your submission. If email confirmation was part of this step, check your inbox (and spam).",
        bullets: [
          "We’ll follow up if a human step is needed.",
          "You can return to the site anytime using the links below.",
        ],
      };
  }
}

export default function ThankYouContent() {
  const searchParams = useSearchParams();
  const formParam = searchParams.get("form");
  const formId = useMemo(() => normalizeThankYouFormId(formParam), [formParam]);
  const copy = copyForForm(formId);
  const [extras, setExtras] = useState<SessionExtras | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let bookingManageHref: string | null = null;
    let bookingEmailSent: boolean | null = null;
    let resumeDownloadUrl: string | null = null;

    if (formId === "native_booking") {
      bookingManageHref = sessionStorage.getItem(THANK_YOU_SESSION.bookingManageHref);
      const raw = sessionStorage.getItem(THANK_YOU_SESSION.bookingEmailSent);
      bookingEmailSent = raw === null ? null : raw === "true";
      sessionStorage.removeItem(THANK_YOU_SESSION.bookingManageHref);
      sessionStorage.removeItem(THANK_YOU_SESSION.bookingEmailSent);
    } else {
      sessionStorage.removeItem(THANK_YOU_SESSION.bookingManageHref);
      sessionStorage.removeItem(THANK_YOU_SESSION.bookingEmailSent);
    }

    if (formId === "resume_request") {
      resumeDownloadUrl = sessionStorage.getItem(THANK_YOU_SESSION.resumeDownloadUrl);
      sessionStorage.removeItem(THANK_YOU_SESSION.resumeDownloadUrl);
    } else {
      sessionStorage.removeItem(THANK_YOU_SESSION.resumeDownloadUrl);
    }

    setExtras({ bookingManageHref, bookingEmailSent, resumeDownloadUrl });
  }, [formId]);

  const bookingEmailNote =
    formId === "native_booking" && extras?.bookingEmailSent === false
      ? "We saved your meeting. If you don’t see a confirmation email, check spam or contact us."
      : null;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-section to-background"
      data-conversion-thank-you
      data-conversion-form={formId}
    >
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card className="border-primary/20">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{copy.title}</h1>
            <p className="text-muted-foreground mb-6">{copy.body}</p>
            {bookingEmailNote ? (
              <p className="text-sm text-muted-foreground mb-6 text-left rounded-lg bg-elevated border border-border/60 p-3">
                {bookingEmailNote}
              </p>
            ) : null}

            {copy.bullets && copy.bullets.length > 0 ? (
              <div className="text-left space-y-4 rounded-lg bg-elevated border border-border/60 p-4 mb-6">
                <p className="text-sm font-medium text-foreground">What happens next</p>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  {copy.bullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {formId === "strategy_call_landing" ? (
              <div className="text-left space-y-4 rounded-lg border border-border bg-section/50 dark:bg-section/20 p-4 mb-6">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary shrink-0" />
                  What to prepare for the call
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {STRATEGY_CALL_PREP_CHECKLIST.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-primary shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {formId === "resume_request" && extras?.resumeDownloadUrl ? (
              <div className="mb-6">
                <Button
                  className="w-full gap-2"
                  onClick={() => window.open(extras.resumeDownloadUrl!, "_blank", "noopener,noreferrer")}
                >
                  Download resume
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {formId === "native_booking" && extras?.bookingManageHref ? (
                <Button asChild variant="default" className="gap-2">
                  <Link href={extras.bookingManageHref}>View or cancel booking</Link>
                </Button>
              ) : null}
              <Button asChild variant="default" className="gap-2">
                <Link href="/strategy-call">
                  <Calendar className="h-4 w-4" />
                  Book a strategy call
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={BRAND_GROWTH_PATH}>Brand Growth</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/">
                  Back to home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
