"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  DollarSign, 
  Target, 
  Code, 
  Mail,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProposalDocument } from "@/components/assessment/ProposalDocument";
import { BudgetComparison } from "@/components/assessment/BudgetComparison";
import { DragDropFeatureSelector } from "@/components/assessment/DragDropFeatureSelector";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AssessmentResult {
  id: number;
  name: string;
  email: string;
  assessmentData: any;
  pricingBreakdown: any;
  createdAt: string;
}

function AssessmentResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const assessmentId = searchParams.get("id");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [requiresAccount, setRequiresAccount] = useState(false);

  useEffect(() => {
    setFetchError(null);
    setFetchDone(false);
    if (!assessmentId) {
      setFetchDone(true);
      setFetchError("No assessment ID in URL.");
      return;
    }
    fetch(`/api/assessment/${assessmentId}`)
      .then((res) => res.json().then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (res.ok && data.success && data.assessment) {
          setAssessment(data.assessment);
          setRequiresAccount(data.requiresAccount || false);
          setFetchError(null);
          try {
            if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
              localStorage.setItem(`assessment_${assessmentId}`, JSON.stringify(data.assessment));
            }
          } catch (e) {
            console.warn("Failed to save to localStorage:", e);
          }
        } else {
          setFetchError(data?.error || "Assessment could not be loaded.");
        }
      })
      .catch((error) => {
        console.error("Error fetching assessment:", error);
        setFetchError("Network error. Please check your connection and try again.");
        try {
          if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
            const stored = localStorage.getItem(`assessment_${assessmentId}`);
            if (stored) {
              setAssessment(JSON.parse(stored));
              setFetchError(null);
            }
          }
        } catch (storageError) {
          console.warn("Failed to read from localStorage:", storageError);
        }
      })
      .finally(() => setFetchDone(true));
  }, [assessmentId]);

  if (!fetchDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Loading Assessment...</h2>
          <p className="text-muted-foreground">Retrieving your assessment results.</p>
        </div>
      </div>
    );
  }

  if (fetchError && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Unable to Load Assessment</h2>
          <p className="text-muted-foreground mb-4">{fetchError}</p>
          <Button onClick={() => router.push("/assessment")} variant="default">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessment
          </Button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  const { assessmentData, pricingBreakdown } = assessment;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Assessment Complete!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for completing the assessment! Your professional proposal with detailed cost breakdown, timeline, and project scope is ready below. You can view it in your browser and download it as PDF, TXT, or DOCX.
          </p>
          {!user && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Create an account to access your dashboard
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Set up your account to view all your quotes, track project progress, receive announcements, and manage invoices in one place.
                  </p>
                  <Button
                    onClick={() => router.push("/auth?redirect=/dashboard")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Pricing Summary Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Market Price Reference
            </CardTitle>
            <CardDescription>
              Market average prices for reference - your personalized quote will be sent via email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                ⚠️ Important: These are market average prices for reference only
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Your personalized quote tailored to your specific project needs and budget will be sent to your email within 24 hours.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Average Range</p>
                <p className="text-3xl font-bold text-primary">
                  ${pricingBreakdown?.estimatedRange?.min.toLocaleString()} - ${pricingBreakdown?.estimatedRange?.max.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Industry reference only</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Industry Average</p>
                <p className="text-3xl font-bold">
                  ${pricingBreakdown?.estimatedRange?.average.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Market reference</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Average</p>
                <p className="text-3xl font-bold">
                  ${pricingBreakdown?.marketComparison?.average.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Industry standard</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        {pricingBreakdown?.features && pricingBreakdown.features.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Market Price Breakdown</CardTitle>
              <CardDescription>How the market average estimate is calculated (for reference only)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Base Price</span>
                  <span className="font-bold">${pricingBreakdown.basePrice.toLocaleString()}</span>
                </div>

                {pricingBreakdown.features.map((feature: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{feature.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {feature.category}
                      </Badge>
                    </div>
                    <span className="font-semibold">+${feature.price.toLocaleString()}</span>
                  </div>
                ))}

                {pricingBreakdown.complexity && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Complexity Factor</span>
                      <p className="text-xs text-gray-500">{pricingBreakdown.complexity.description}</p>
                    </div>
                    <span className="font-semibold">×{pricingBreakdown.complexity.multiplier}</span>
                  </div>
                )}

                {pricingBreakdown.timeline && pricingBreakdown.timeline.rush && (
                  <div className="flex justify-between items-center p-3 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
                    <div>
                      <span className="font-medium">Rush Timeline</span>
                      <p className="text-xs text-gray-500">Faster delivery requires additional resources</p>
                    </div>
                    <span className="font-semibold text-yellow-600">×{pricingBreakdown.timeline.multiplier}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="text-lg font-bold">Market Average Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${pricingBreakdown.estimatedRange.min.toLocaleString()} - ${pricingBreakdown.estimatedRange.max.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Project Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Project:</strong> {assessmentData.projectName}</p>
                  <p><strong>Type:</strong> {assessmentData.projectType?.replace("-", " ")}</p>
                  <p><strong>Platforms:</strong> {assessmentData.platform?.join(", ")}</p>
                  <p><strong>Timeline:</strong> {assessmentData.preferredTimeline?.replace(/-/g, " ")}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Key Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {assessmentData.mustHaveFeatures?.slice(0, 6).map((feature: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{feature}</Badge>
                  ))}
                  {assessmentData.mustHaveFeatures?.length > 6 && (
                    <Badge variant="outline">+{assessmentData.mustHaveFeatures.length - 6} more</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
            <CardDescription>We'll review your assessment and get back to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Review & Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We'll carefully review your project requirements and goals
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Custom Proposal</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We'll create a detailed proposal tailored to your budget and timeline
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Schedule a Call</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We'll reach out within 24 hours to discuss your project in detail
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Adjustment Section */}
        <Separator className="my-8" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Adjust Your Features
            </CardTitle>
            <CardDescription>
              Drag and drop features to remove them and see how it affects your pricing. Required features cannot be removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropFeatureSelector
              selectedFeatures={assessmentData.mustHaveFeatures || []}
              onFeaturesChange={async (newFeatures) => {
                setIsUpdating(true);
                try {
                  const response = await fetch(`/api/assessment/${assessment.id}/update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      mustHaveFeatures: newFeatures,
                    }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                      // Update assessment with new pricing
                      setAssessment({
                        ...assessment,
                        assessmentData: {
                          ...assessment.assessmentData,
                          mustHaveFeatures: newFeatures,
                        },
                        pricingBreakdown: data.assessment.pricingBreakdown,
                      });
                      // Update localStorage
                      localStorage.setItem(`assessment_${assessment.id}`, JSON.stringify({
                        ...assessment,
                        assessmentData: {
                          ...assessment.assessmentData,
                          mustHaveFeatures: newFeatures,
                        },
                        pricingBreakdown: data.assessment.pricingBreakdown,
                      }));
                    }
                  }
                } catch (error) {
                  console.error("Error updating features:", error);
                } finally {
                  setIsUpdating(false);
                }
              }}
              projectType={assessmentData.projectType}
              assessmentData={assessmentData}
              onPriceUpdate={(newPrice) => {
                // Price will be updated via the assessment state
                // This callback can be used for immediate UI feedback if needed
              }}
            />
            {isUpdating && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating pricing...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Comparison */}
        <Separator className="my-8" />
        <BudgetComparison assessmentId={assessment.id} />

        {/* Proposal Document */}
        <Separator className="my-8" />
        <ProposalDocument assessmentId={assessment.id} />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            <Mail className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/#contact")}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Assessment...</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we retrieve your assessment results.
          </p>
        </div>
      </div>
    }>
      <AssessmentResultsContent />
    </Suspense>
  );
}
