"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqSectionProps {
  /** FAQ items: question (q) and answer (a) */
  items: FaqItem[];
  /** Section heading. Default: "Frequently Asked Questions" */
  title?: string;
  /** Optional className for the wrapping section */
  className?: string;
  /** Optional id for the section */
  id?: string;
}

export function FaqSection({
  items,
  title = "Frequently Asked Questions",
  className = "",
  id,
}: FaqSectionProps) {
  if (!items?.length) return null;

  return (
    <section
      id={id}
      className={`w-full min-w-0 max-w-full py-10 fold:py-12 xs:py-16 sm:py-20 ${className}`}
      aria-label={title}
    >
      <div className="container mx-auto px-3 fold:px-4 sm:px-4 md:px-6 min-w-0 max-w-2xl">
        <h2 className="text-xl fold:text-2xl sm:text-3xl font-bold text-center text-foreground mb-8 sm:mb-10">
          {title}
        </h2>
        <Card className="border-border bg-card shadow-sm overflow-hidden min-w-0">
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {items.map(({ q, a }, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-border last:border-0 px-4 sm:px-6"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base py-3 sm:py-4 hover:no-underline">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base text-muted-foreground pb-4">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
