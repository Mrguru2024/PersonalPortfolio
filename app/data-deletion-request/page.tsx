"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { funnelThankYouUrl } from "@/lib/funnelThankYou";

export default function DataDeletionRequestPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm that you understand the effect of this request.",
        variant: "destructive",
      });
      return;
    }
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the email address associated with your data.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/data-deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Request failed",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Request received",
        description: data.message,
      });
      router.replace(funnelThankYouUrl("data_deletion"));
    } catch {
      toast({
        title: "Request failed",
        description: "Could not send your request. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Trash2 className="h-8 w-8 sm:h-9 sm:w-9 text-primary" />
                Request data deletion
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use this form to request removal of your personal data from our systems.
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
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">What happens when you submit</p>
                  <p className="text-muted-foreground">
                    We will receive your request and process it in line with our Privacy Policy. We may contact you at the email you provide to verify your identity and confirm once your data has been removed. Some data may be retained where required by law (e.g. for accounting or legal obligations).
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                    Email address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="max-w-md"
                    autoComplete="email"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use the email associated with the data you want removed.
                  </p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                    Name (optional)
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="max-w-md"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                    Additional details (optional)
                  </label>
                  <Textarea
                    id="message"
                    placeholder="e.g. which services you used, or any specific data you want removed"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-y"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="confirm"
                    checked={confirmed}
                    onCheckedChange={(c) => setConfirmed(!!c)}
                    aria-describedby="confirm-desc"
                  />
                  <label id="confirm-desc" htmlFor="confirm" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    I understand that I am requesting the deletion of my personal data and that I may be contacted to verify my identity. I have read the{" "}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending…" : "Submit request"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/privacy">Privacy Policy</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            You can also contact us directly via our{" "}
            <Link href="/contact" className="text-primary hover:underline">contact page</Link>
            {" "}to request data deletion.
          </p>
        </div>
      </div>
    </div>
  );
}
