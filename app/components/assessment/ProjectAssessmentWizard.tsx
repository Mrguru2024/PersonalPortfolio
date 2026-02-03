"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectAssessment } from "@shared/assessmentSchema";

const PROJECT_TYPES = [
  "website",
  "web-app",
  "mobile-app",
  "ecommerce",
  "saas",
  "api",
  "other",
] as const;
const PLATFORMS = ["web", "ios", "android", "desktop", "api-only"] as const;
const MAIN_GOALS = [
  "Increase revenue",
  "Improve efficiency",
  "Expand market",
  "Enhance brand",
  "Other",
];
const FEATURES = [
  "User authentication",
  "Dashboard",
  "Search",
  "Payments",
  "Notifications",
  "API",
  "Admin panel",
  "Reporting",
];

interface ProjectAssessmentWizardProps {
  serviceId?: string | null;
}

export function ProjectAssessmentWizard({
  serviceId,
}: Readonly<ProjectAssessmentWizardProps>) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    projectName: "",
    projectType: "web-app" as ProjectAssessment["projectType"],
    projectDescription: "",
    targetAudience: "",
    mainGoals: [] as string[],
    platform: ["web"] as ProjectAssessment["platform"],
    mustHaveFeatures: [] as string[],
    newsletter: false,
  });

  const toggleArray = (
    key: "mainGoals" | "platform" | "mustHaveFeatures",
    value: string
  ) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(value)
        ? arr.filter((x) => x !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  function buildPayload(): ProjectAssessment {
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      company: form.company || undefined,
      role: form.role || undefined,
      projectName: form.projectName,
      projectType: form.projectType,
      projectDescription: form.projectDescription,
      targetAudience: form.targetAudience,
      mainGoals: form.mainGoals,
      platform: form.platform,
      mustHaveFeatures: form.mustHaveFeatures,
      newsletter: form.newsletter,
      paymentProcessing: false,
      realTimeFeatures: false,
      hasBrandGuidelines: false,
      responsiveDesign: true,
      ongoingMaintenance: false,
    };
    return payload as ProjectAssessment;
  }

  const handleSubmit = async () => {
    setError(null);
    if (form.projectDescription.length < 50) {
      setError("Project description must be at least 50 characters.");
      return;
    }
    if (form.targetAudience.length < 10) {
      setError("Target audience must be at least 10 characters.");
      return;
    }
    if (form.mainGoals.length === 0) {
      setError("Select at least one main goal.");
      return;
    }
    if (form.mustHaveFeatures.length === 0) {
      setError("Select at least one must-have feature.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.message || "Submission failed");
      const id = data.assessment?.id ?? data.id;
      if (id) router.push(`/assessment/results?id=${id}`);
      else setError("Submission succeeded but no assessment ID returned.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Project Assessment
          </CardTitle>
          <CardDescription>
            Step {step} of 2 —{" "}
            {step === 1 ? "Contact & project" : "Technical requirements"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="your@email.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Project name *</Label>
                <Input
                  value={form.projectName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, projectName: e.target.value }))
                  }
                  placeholder="My Project"
                />
              </div>
              <div className="grid gap-2">
                <Label>Project type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.projectType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      projectType: e.target
                        .value as ProjectAssessment["projectType"],
                    }))
                  }
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Project description * (min 50 characters)</Label>
                <Textarea
                  value={form.projectDescription}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      projectDescription: e.target.value,
                    }))
                  }
                  placeholder="Describe your project..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Target audience * (min 10 characters)</Label>
                <Input
                  value={form.targetAudience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetAudience: e.target.value }))
                  }
                  placeholder="Who will use this?"
                />
              </div>
              <div className="grid gap-2">
                <Label>Main goals * (select at least one)</Label>
                <div className="flex flex-wrap gap-2">
                  {MAIN_GOALS.map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant={
                        form.mainGoals.includes(g) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleArray("mainGoals", g)}
                    >
                      {g}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Platforms * (select at least one)</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={
                        form.platform.includes(p) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          platform: prev.platform.includes(p)
                            ? prev.platform.filter((x) => x !== p)
                            : [...prev.platform, p],
                        }));
                      }}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Must-have features * (select at least one)</Label>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      variant={
                        form.mustHaveFeatures.includes(f)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleArray("mustHaveFeatures", f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step === 1 ? (
              <div />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button type="button" onClick={() => setStep(2)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
