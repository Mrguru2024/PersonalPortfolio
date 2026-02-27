"use client";

import { InteractiveFAQ } from "@/components/FAQ/InteractiveFAQ";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about web development, pricing, timelines, and working with us. 
            All explained in simple, easy-to-understand language - no technical jargon!
          </p>
        </div>

        {/* FAQ Component */}
        <InteractiveFAQ />

        {/* Still Have Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Still Have Questions?
            </CardTitle>
            <CardDescription>
              Can't find what you're looking for? We're here to help!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground">
              If you have questions that aren't covered here, or if you'd like to discuss your specific project needs, 
              we'd love to hear from you. Get in touch and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button asChild size="lg" className="flex-1 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                <Link href="/#contact" className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Contact Us</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                <Link href="/assessment" className="flex items-center justify-center">
                  <span className="whitespace-nowrap">Start Project Assessment</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
