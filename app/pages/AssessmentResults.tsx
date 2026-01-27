"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Target, 
  Code, 
  Palette,
  Mail,
  ArrowLeft,
  Download,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AssessmentResult {
  id: number;
  name: string;
  email: string;
  assessmentData: any;
  pricingBreakdown: any;
  createdAt: string;
}

export default function AssessmentResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assessmentId = searchParams.get("id");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    if (assessmentId) {
      // In a real app, fetch from API
      // For now, we'll get it from localStorage or show a message
      const stored = localStorage.getItem(`assessment_${assessmentId}`);
      if (stored) {
        setAssessment(JSON.parse(stored));
      }
    }
  }, [assessmentId]);

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Assessment Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn't find your assessment. Please start a new one.
          </p>
          <Button onClick={() => router.push("/assessment")}>
            Start New Assessment
          </Button>
        </div>
      </div>
    );
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
            Thank you for completing the assessment. Here's your custom estimate.
          </p>
        </motion.div>

        {/* Pricing Summary Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Your Custom Estimate
            </CardTitle>
            <CardDescription>
              Based on your project requirements and industry standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated Range</p>
                <p className="text-3xl font-bold text-primary">
                  ${pricingBreakdown?.estimatedRange?.min.toLocaleString()} - ${pricingBreakdown?.estimatedRange?.max.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Custom-fitted to your project</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Estimate</p>
                <p className="text-3xl font-bold">
                  ${pricingBreakdown?.estimatedRange?.average.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Based on your requirements</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Average</p>
                <p className="text-3xl font-bold">
                  ${pricingBreakdown?.marketComparison?.average.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">Industry standard</p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium mb-2">💡 Important Note</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This is an <strong>estimated range</strong> based on your answers. Final pricing is 
                <strong> custom-fitted</strong> to your specific project needs, timeline, and budget. 
                We'll work with you to create a solution that fits your requirements perfectly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        {pricingBreakdown?.features && pricingBreakdown.features.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pricing Breakdown</CardTitle>
              <CardDescription>How your estimate is calculated</CardDescription>
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
                  <span className="text-lg font-bold">Estimated Total</span>
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => router.push("/#contact")}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us Directly
          </Button>
        </div>
      </div>
    </div>
  );
}
