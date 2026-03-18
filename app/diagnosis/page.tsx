"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useFunnel } from "@/lib/funnel-store";
import {
  getQuestionsByCategory,
  CATEGORY_LABELS,
  type CategoryId,
  calculateScores,
  DIAGNOSIS_QUESTIONS,
} from "@/lib/scoring";

const CATEGORY_ORDER: CategoryId[] = ["brand", "design", "website", "leads", "automation"];

export default function DiagnosisPage() {
  const router = useRouter();
  const { answers, setAnswer, setScores } = useFunnel();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const byCategory = getQuestionsByCategory();
  const currentCategory = CATEGORY_ORDER[step];
  const questions = byCategory[currentCategory] ?? [];
  const totalSteps = CATEGORY_ORDER.length;
  const isLastStep = step === totalSteps - 1;

  const allAnswered = DIAGNOSIS_QUESTIONS.every((q) => answers[q.id]);
  const canProceed = isLastStep ? allAnswered : questions.every((q) => answers[q.id]);
  const currentAnswers = questions.filter((q) => answers[q.id]).length;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      setSubmitting(true);
      const scores = calculateScores(answers);
      setScores(scores);
      router.push("/results");
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [isLastStep, answers, setScores, router, totalSteps]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/growth" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to growth diagnosis
          </Link>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex justify-between gap-1 mb-2">
            {CATEGORY_ORDER.map((cat, i) => (
              <div
                key={cat}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step + 1} of {totalSteps}: {CATEGORY_LABELS[currentCategory]}
          </p>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-foreground">
              {CATEGORY_LABELS[currentCategory]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Answer the questions below. Your answers are saved as you go.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <AnimatePresence mode="wait">
              {questions.map((q) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <Label className="text-base font-medium">{q.question}</Label>
                  <RadioGroup
                    value={answers[q.id] ?? ""}
                    onValueChange={(value) => setAnswer(q.id, value)}
                    className="flex flex-col gap-2"
                  >
                    {q.options.map((opt) => (
                      <div
                        key={opt.value}
                        className="flex items-center space-x-2 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                      >
                        <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                        <Label
                          htmlFor={`${q.id}-${opt.value}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLastStep ? (
                  "See results"
                ) : (
                  "Next"
                )}
                {!submitting && !isLastStep && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {currentAnswers} of {questions.length} answered in this section
        </p>
      </div>
    </div>
  );
}
