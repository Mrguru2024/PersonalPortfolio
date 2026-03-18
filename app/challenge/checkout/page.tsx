"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CHALLENGE_PRICE_DISPLAY, ORDER_BUMP } from "@/lib/challenge/config";

const checkoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  businessName: z.string().optional(),
  website: z.string().optional(),
  businessType: z.string().optional(),
  orderBump: z.boolean().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function ChallengeCheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { orderBump: ORDER_BUMP.enabled },
  });

  const orderBump = watch("orderBump");

  const [submitting, setSubmitting] = useState(false);
  const onSubmit = async (data: CheckoutFormData) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenge/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          businessName: data.businessName || "",
          website: data.website || "",
          businessType: data.businessType || "",
          orderBump: data.orderBump ?? false,
          source: "challenge",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }
      router.push(json.redirect ?? "/challenge/welcome");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/challenge" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to challenge
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-foreground">Join the challenge</h1>
            <p className="text-muted-foreground">Enter your details. You&apos;ll get access to the dashboard and day-one materials.</p>
            <p className="text-lg font-semibold text-foreground">{CHALLENGE_PRICE_DISPLAY} — one-time</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{error}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input id="fullName" {...register("fullName")} placeholder="Your name" />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="you@company.com" />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input id="businessName" {...register("businessName")} placeholder="Company or brand" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" {...register("website")} placeholder="https://" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business type</Label>
                <Input id="businessType" {...register("businessType")} placeholder="e.g. Coach, Consultant" />
              </div>

              {ORDER_BUMP.enabled && (
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <Checkbox
                    id="orderBump"
                    checked={orderBump}
                    onCheckedChange={(v) => setValue("orderBump", Boolean(v))}
                  />
                  <div>
                    <Label htmlFor="orderBump" className="font-medium cursor-pointer">{ORDER_BUMP.title}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">{ORDER_BUMP.description}</p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  <>Complete registration — {CHALLENGE_PRICE_DISPLAY}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
