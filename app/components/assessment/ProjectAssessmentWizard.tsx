"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Lightbulb,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { FormLabelWithTooltip } from "@/components/ui/FormLabelWithTooltip";
import { DragDropFeatureSelector } from "./DragDropFeatureSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { projectAssessmentSchema, type ProjectAssessment } from "@shared/assessmentSchema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { AIAssistant } from "./AIAssistant";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Tell us about yourself" },
  { id: 2, title: "Project Vision", description: "What are you building?" },
  { id: 3, title: "Technical Needs", description: "Technical requirements" },
  { id: 4, title: "Design & UX", description: "Design preferences" },
  { id: 5, title: "Business Goals", description: "Success metrics" },
  { id: 6, title: "Timeline & Budget", description: "Project constraints" },
  { id: 7, title: "Review & Submit", description: "Final review" },
];

interface PricingPreview {
  estimatedRange: {
    min: number;
    max: number;
    average: number;
  };
  marketComparison: {
    lowEnd: number;
    highEnd: number;
    average: number;
  };
}

export function ProjectAssessmentWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(null);
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProjectAssessment>({
    resolver: zodResolver(projectAssessmentSchema),
    mode: "onChange",
    defaultValues: {
      // Step 1: Basic Information - all string fields need empty string defaults
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "",
      
      // Step 2: Project Vision & Goals
      projectName: "",
      projectType: undefined,
      projectDescription: "",
      targetAudience: "",
      mainGoals: [],
      successMetrics: "",
      
      // Step 3: Technical Requirements
      platform: [],
      preferredTechStack: [],
      mustHaveFeatures: [],
      niceToHaveFeatures: [],
      integrations: [],
      thirdPartyServices: [],
      dataStorage: undefined,
      userAuthentication: undefined,
      paymentProcessing: false,
      realTimeFeatures: false,
      apiRequirements: undefined,
      
      // Step 4: Design & UX Requirements
      designStyle: undefined,
      hasBrandGuidelines: false,
      brandGuidelinesDescription: "",
      responsiveDesign: true,
      accessibilityRequirements: undefined,
      userExperiencePriority: undefined,
      contentManagement: undefined,
      
      // Step 5: Business Goals & Metrics
      businessStage: undefined,
      primaryBusinessGoal: undefined,
      expectedUsers: undefined,
      revenueModel: undefined,
      competitiveAdvantage: "",
      
      // Step 6: Timeline & Budget
      preferredTimeline: undefined,
      budgetRange: undefined,
      budgetFlexibility: undefined,
      ongoingMaintenance: false,
      hostingPreferences: undefined,
      
      // Additional Information
      additionalNotes: "",
      referralSource: "",
      newsletter: false,
    },
  });

  const watchedValues = form.watch();

  // Calculate pricing preview when relevant fields change
  useEffect(() => {
    const hasEnoughData = 
      watchedValues.projectType && 
      watchedValues.platform && 
      watchedValues.platform.length > 0;

    if (hasEnoughData && currentStep >= 3) {
      const timer = setTimeout(async () => {
        setIsCalculatingPricing(true);
        try {
          const response = await fetch("/api/assessment/pricing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(watchedValues),
          });
          const data = await response.json();
          if (data.success) {
            setPricingPreview({
              estimatedRange: data.pricing.estimatedRange,
              marketComparison: data.pricing.marketComparison,
            });
          }
        } catch (error) {
          console.error("Error calculating pricing:", error);
        } finally {
          setIsCalculatingPricing(false);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    watchedValues.projectType,
    watchedValues.platform,
    watchedValues.mustHaveFeatures,
    watchedValues.userAuthentication,
    watchedValues.paymentProcessing,
    watchedValues.realTimeFeatures,
    watchedValues.contentManagement,
    watchedValues.apiRequirements,
    watchedValues.integrations,
    watchedValues.designStyle,
    watchedValues.dataStorage,
    watchedValues.preferredTimeline,
    currentStep,
  ]);

  const submitMutation = useMutation({
    mutationFn: async (data: ProjectAssessment) => {
      const response = await apiRequest("POST", "/api/assessment", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Store assessment data for results page
      if (data.assessment?.id) {
        const fullAssessment = {
          id: data.assessment.id,
          name: form.getValues("name"),
          email: form.getValues("email"),
          assessmentData: form.getValues(),
          pricingBreakdown: data.assessment.pricingBreakdown,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(`assessment_${data.assessment.id}`, JSON.stringify(fullAssessment));
      }
      
      const budgetRange = form.getValues("budgetRange");
      const isLowBudget = budgetRange === "under-5k" || budgetRange === "1-2k" || budgetRange === "2-5k";
      
      toast({
        title: "Assessment Submitted!",
        description: isLowBudget 
          ? "Your professional proposal with realistic budget options will be generated. Check the results page to view and download it."
          : "Your professional proposal will be generated. Check the results page to view and download it.",
      });
      router.push(`/assessment/results?id=${data.assessment.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePriceUpdate = (newPrice: number) => {
    setCurrentPrice(newPrice);
    // Optionally update pricing preview
    if (pricingPreview) {
      setPricingPreview({
        ...pricingPreview,
        estimatedRange: {
          min: Math.round(newPrice * 0.8),
          max: Math.round(newPrice * 1.2),
          average: newPrice,
        },
      });
    }
  };

  const onSubmit = (data: ProjectAssessment) => {
    submitMutation.mutate(data);
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4" variant="outline">
            <Sparkles className="h-3 w-3 mr-2" />
            Interactive Project Assessment
          </Badge>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Let's Build Your Vision
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Answer a few questions and receive a personalized quote tailored to your project
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8 overflow-x-auto pb-4">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center min-w-[80px] ${
                step.id <= currentStep ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${
                  step.id < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-xs text-center font-medium">{step.title}</span>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {STEPS[currentStep - 1].title}
                      {currentStep === 2 && (
                        <AIAssistant
                          type="generate-ideas"
                          context={watchedValues.projectDescription || ""}
                          currentAnswers={watchedValues}
                        />
                      )}
                    </CardTitle>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderStep(currentStep, form, watchedValues)}
                  </CardContent>
                </Card>

                {/* Pricing Preview */}
                {pricingPreview && currentStep >= 3 && (
                  <Card className="mb-6 border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Market Price Reference</h3>
                        {isCalculatingPricing && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                      </div>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                          ⚠️ Important: These are market average prices for reference only
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Your custom quote will be sent to you after completing this assessment. Our pricing is tailored to your specific project needs and budget.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Market Average Range</p>
                          <p className="text-2xl font-bold text-primary">
                            ${pricingPreview.estimatedRange.min.toLocaleString()} - ${pricingPreview.estimatedRange.max.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry Average</p>
                          <p className="text-2xl font-bold">
                            ${pricingPreview.marketComparison.average.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Market Range</p>
                          <p className="text-lg">
                            ${pricingPreview.marketComparison.lowEnd.toLocaleString()} - ${pricingPreview.marketComparison.highEnd.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
                        💡 These prices are based on industry averages. Your personalized quote will be delivered via email after you complete and submit this assessment.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep}>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="bg-gradient-to-r from-primary to-purple-600"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Assessment
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

// Helper function to get fields for each step
function getFieldsForStep(step: number): (keyof ProjectAssessment)[] {
  switch (step) {
    case 1:
      return ["name", "email"];
    case 2:
      return ["projectName", "projectType", "projectDescription", "targetAudience", "mainGoals"];
    case 3:
      return ["platform", "mustHaveFeatures"];
    case 4:
      return [];
    case 5:
      return [];
    case 6:
      return [];
    default:
      return [];
  }
}

// Render step content
function renderStep(
  step: number,
  form: any,
  watchedValues: Partial<ProjectAssessment>
) {
  switch (step) {
    case 1:
      return <Step1BasicInfo form={form} />;
    case 2:
      return <Step2ProjectVision form={form} watchedValues={watchedValues} />;
      case 3:
        return <Step3TechnicalNeeds form={form} onPriceUpdate={handlePriceUpdate} />;
      case 4:
        return <Step4DesignUX form={form} watchedValues={watchedValues} />;
      case 5:
        return <Step5BusinessGoals form={form} watchedValues={watchedValues} />;
    case 6:
      return <Step6TimelineBudget form={form} />;
    case 7:
      return <Step7Review form={form} watchedValues={watchedValues} />;
    default:
      return null;
  }
}

// Step 1: Basic Information
function Step1BasicInfo({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address *</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john@example.com" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Role</FormLabel>
            <FormControl>
              <Input placeholder="CEO, Product Manager, etc." {...field} />
            </FormControl>
            <FormDescription>What's your role in this project?</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 2: Project Vision
function Step2ProjectVision({ form, watchedValues }: { form: any; watchedValues: any }) {
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const handleAIGenerate = async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch("/api/assessment/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "generate-ideas",
          context: watchedValues.projectDescription || "",
          currentAnswers: watchedValues,
        }),
      });
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="projectName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name *</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Project" {...field} value={field.value || ""} />
              </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="projectType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="web-app">Web Application</SelectItem>
                <SelectItem value="mobile-app">Mobile App</SelectItem>
                <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                <SelectItem value="saas">SaaS Platform</SelectItem>
                <SelectItem value="api">API/Backend Service</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="projectDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Description *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your project vision, what problem it solves, and what makes it unique..."
                className="min-h-[120px]"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              Minimum 50 characters. Be as detailed as possible.
            </FormDescription>
            <FormMessage />
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIGenerate}
                disabled={isLoadingAI}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isLoadingAI ? "Generating..." : "Get AI Ideas"}
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  AI Suggestions:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {aiSuggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Who will use this product? (e.g., small business owners, tech-savvy millennials, enterprise teams...)"
                className="min-h-[80px]"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mainGoals"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel>Main Goals *</FormLabel>
              <FormDescription>Select all that apply</FormDescription>
            </div>
            {[
              "Increase revenue",
              "Reduce operational costs",
              "Improve user experience",
              "Expand to new markets",
              "Automate business processes",
              "Build brand presence",
              "Collect and analyze data",
              "Improve customer engagement",
            ].map((goal) => (
              <FormField
                key={goal}
                control={form.control}
                name="mainGoals"
                render={({ field }) => {
                  return (
                    <FormItem
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(goal)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, goal])
                              : field.onChange(
                                  field.value?.filter((value: string) => value !== goal)
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {goal}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="successMetrics"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Success Metrics</FormLabel>
            <FormControl>
              <Textarea
                placeholder="How will you measure success? (e.g., user signups, revenue, engagement metrics...)"
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 3: Technical Needs (continuing in next part due to length)
function Step3TechnicalNeeds({ form, onPriceUpdate }: { form: any; onPriceUpdate?: (price: number) => void }) {
  const [featureSuggestions, setFeatureSuggestions] = useState<string[]>([]);
  const projectType = form.watch("projectType");
  const mustHaveFeatures = form.watch("mustHaveFeatures") || [];

  useEffect(() => {
    if (projectType) {
      fetch("/api/assessment/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "suggest-features",
          context: projectType,
          currentAnswers: form.getValues(),
        }),
      })
        .then((res) => res.json())
        .then((data) => setFeatureSuggestions(data.suggestions || []))
        .catch(console.error);
    }
  }, [projectType, form]);

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="platform"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabelWithTooltip 
                label="Platform(s)" 
                term="platform"
                definition="The devices or systems where your project will be available - like websites (computers/phones), mobile apps (iPhone/Android), or desktop applications."
                required 
              />
              <FormDescription>Where will your project be available?</FormDescription>
            </div>
            {["web", "ios", "android", "desktop", "api-only"].map((platform) => (
              <FormField
                key={platform}
                control={form.control}
                name="platform"
                render={({ field }) => {
                  return (
                    <FormItem
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(platform)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, platform])
                              : field.onChange(
                                  field.value?.filter((value: string) => value !== platform)
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer capitalize">
                        {platform.replace("-", " ")}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={form.control}
        name="dataStorage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data Storage Complexity</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select complexity level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="simple">Simple (Basic data, few tables)</SelectItem>
                <SelectItem value="moderate">Moderate (Standard database structure)</SelectItem>
                <SelectItem value="complex">Complex (Advanced relationships, multiple data sources)</SelectItem>
                <SelectItem value="enterprise">Enterprise (Large scale, complex architecture)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="userAuthentication"
        render={({ field }) => (
          <FormItem>
            <FormLabelWithTooltip 
              label="User Authentication" 
              term="authentication"
            />
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">None Required</SelectItem>
                <SelectItem value="basic">Basic (Email/Password)</SelectItem>
                <SelectItem value="social-login">Social Login (Google, Facebook, etc.)</SelectItem>
                <SelectItem value="enterprise-sso">Enterprise SSO</SelectItem>
                <SelectItem value="custom">Custom Authentication</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="paymentProcessing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabelWithTooltip 
                label="Payment Processing" 
                term="payment-processing"
              />
              <FormDescription>
                Accept payments, subscriptions, or transactions
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="realTimeFeatures"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabelWithTooltip 
                label="Real-time Features" 
                term="real-time-chat"
                definition="Features that update instantly without refreshing the page, like live chat, notifications, or collaborative editing."
              />
              <FormDescription>
                Live updates, chat, notifications, or collaborative features
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="apiRequirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Requirements</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select API needs" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No API needed</SelectItem>
                <SelectItem value="internal">Internal API only</SelectItem>
                <SelectItem value="public">Public API</SelectItem>
                <SelectItem value="both">Both Internal and Public</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mustHaveFeatures"
        render={({ field }) => (
          <FormItem>
            <div className="mb-4">
              <FormLabel>Must-Have Features *</FormLabel>
              <FormDescription>
                Select all essential features. After selecting, you can drag and drop to remove optional features and adjust your budget.
              </FormDescription>
            </div>
            {Array.from(new Set([
              "User dashboard",
              "Admin panel",
              "Search functionality",
              "File upload/download",
              "Email notifications",
              "Analytics dashboard",
              "Multi-language support",
              "Export/Import data",
              ...featureSuggestions,
            ])).map((feature) => (
              <FormField
                key={feature}
                control={form.control}
                name="mustHaveFeatures"
                render={({ field: nestedField }) => {
                  return (
                    <FormItem
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={nestedField.value?.includes(feature)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? nestedField.onChange([...nestedField.value, feature])
                              : nestedField.onChange(
                                  nestedField.value?.filter((value: string) => value !== feature)
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {feature}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Drag and Drop Feature Selector */}
      {mustHaveFeatures.length > 0 && (
        <div className="mt-6">
          <DragDropFeatureSelector
            selectedFeatures={mustHaveFeatures}
            onFeaturesChange={(newFeatures) => {
              form.setValue("mustHaveFeatures", newFeatures);
            }}
            projectType={projectType}
            assessmentData={form.getValues()}
            onPriceUpdate={onPriceUpdate}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="contentManagement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Management</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select CMS needs" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="static">Static Content (No CMS)</SelectItem>
                <SelectItem value="basic-cms">Basic CMS</SelectItem>
                <SelectItem value="headless-cms">Headless CMS (Contentful, Strapi, etc.)</SelectItem>
                <SelectItem value="custom-cms">Custom CMS</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="integrations"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel>Third-party Integrations</FormLabel>
              <FormDescription>Select any integrations you need</FormDescription>
            </div>
            {[
              "Stripe/Payment Gateway",
              "Email Service (SendGrid, Mailchimp)",
              "Analytics (Google Analytics, Mixpanel)",
              "CRM (Salesforce, HubSpot)",
              "Social Media APIs",
              "Cloud Storage (AWS S3, Google Cloud)",
              "Authentication (Auth0, Firebase)",
              "Other",
            ].map((integration) => (
              <FormField
                key={integration}
                control={form.control}
                name="integrations"
                render={({ field }) => {
                  return (
                    <FormItem
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(integration)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, integration])
                              : field.onChange(
                                  field.value?.filter((value: string) => value !== integration)
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {integration}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 4: Design & UX
function Step4DesignUX({ form, watchedValues }: { form: any; watchedValues: any }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="designStyle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Design Style Preference</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select design style" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="minimalist">Minimalist & Clean</SelectItem>
                <SelectItem value="modern">Modern & Trendy</SelectItem>
                <SelectItem value="corporate">Corporate & Professional</SelectItem>
                <SelectItem value="creative">Creative & Bold</SelectItem>
                <SelectItem value="custom">Fully Custom Design</SelectItem>
                <SelectItem value="not-sure">Not Sure / Open to Suggestions</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hasBrandGuidelines"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>I have existing brand guidelines</FormLabel>
              <FormDescription>
                Colors, fonts, logo, style guide, etc.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {form.watch("hasBrandGuidelines") && (
        <FormField
          control={form.control}
          name="brandGuidelinesDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Guidelines Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your brand guidelines, colors, fonts, or provide links to style guides..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="responsiveDesign"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Responsive Design (Mobile-friendly)</FormLabel>
              <FormDescription>
                Works seamlessly on phones, tablets, and desktops
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="accessibilityRequirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Accessibility Requirements</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select accessibility level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="basic">Basic (Standard web accessibility)</SelectItem>
                <SelectItem value="wcag-aa">WCAG AA Compliance</SelectItem>
                <SelectItem value="wcag-aaa">WCAG AAA Compliance</SelectItem>
                <SelectItem value="custom">Custom Requirements</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="userExperiencePriority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>User Experience Priority</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="What's most important?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="speed">Speed & Performance</SelectItem>
                <SelectItem value="features">Rich Features</SelectItem>
                <SelectItem value="design">Beautiful Design</SelectItem>
                <SelectItem value="accessibility">Accessibility</SelectItem>
                <SelectItem value="balanced">Balanced Approach</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 5: Business Goals
function Step5BusinessGoals({ form, watchedValues }: { form: any; watchedValues: any }) {
  return (
    <div className="space-y-6">
      <AIAssistant
        type="clarify-requirements"
        context="business goals and success metrics"
        currentAnswers={watchedValues}
      />
      <FormField
        control={form.control}
        name="businessStage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Stage</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your business stage" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="idea">Just an Idea</SelectItem>
                <SelectItem value="mvp">Building MVP</SelectItem>
                <SelectItem value="existing-product">Existing Product (Improvement/Redesign)</SelectItem>
                <SelectItem value="scaling">Scaling Existing Product</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="primaryBusinessGoal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Business Goal</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="What's your main goal?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="increase-revenue">Increase Revenue</SelectItem>
                <SelectItem value="reduce-costs">Reduce Costs</SelectItem>
                <SelectItem value="improve-efficiency">Improve Efficiency</SelectItem>
                <SelectItem value="expand-market">Expand to New Markets</SelectItem>
                <SelectItem value="enhance-brand">Enhance Brand Presence</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expectedUsers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expected Number of Users</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="How many users do you expect?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="0-100">0 - 100 users</SelectItem>
                <SelectItem value="100-1000">100 - 1,000 users</SelectItem>
                <SelectItem value="1000-10000">1,000 - 10,000 users</SelectItem>
                <SelectItem value="10000+">10,000+ users</SelectItem>
                <SelectItem value="unknown">Unknown / Not sure</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="revenueModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Revenue Model</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="How will you make money?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="subscription">Subscription/Monthly Recurring</SelectItem>
                <SelectItem value="one-time">One-time Purchase</SelectItem>
                <SelectItem value="freemium">Freemium (Free + Paid Tiers)</SelectItem>
                <SelectItem value="advertising">Advertising Revenue</SelectItem>
                <SelectItem value="marketplace">Marketplace/Commission</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="competitiveAdvantage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Competitive Advantage</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What makes your project unique? What's your competitive advantage?"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 6: Timeline & Budget
function Step6TimelineBudget({ form }: { form: any }) {
  const budgetRange = form.watch("budgetRange");
  const isLowBudget = budgetRange === "under-5k" || budgetRange === "1-2k" || budgetRange === "2-5k";
  
  return (
    <div className="space-y-6">
      {isLowBudget && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Realistic Proposal for Your Budget
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            We understand your budget is under $5,000. After you complete this assessment, 
            you'll receive a professional proposal with realistic options tailored to your budget, 
            including phased development approaches and scope adjustments to deliver maximum value 
            within your budget constraints.
          </p>
        </div>
      )}
      
      <FormField
        control={form.control}
        name="preferredTimeline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Timeline</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="When do you need this completed?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="asap">ASAP (Rush Project)</SelectItem>
                <SelectItem value="1-3-months">1 - 3 Months</SelectItem>
                <SelectItem value="3-6-months">3 - 6 Months</SelectItem>
                <SelectItem value="6-12-months">6 - 12 Months</SelectItem>
                <SelectItem value="flexible">Flexible Timeline</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Rush projects may incur additional costs
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="budgetRange"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Budget Range</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="under-5k">Under $5,000</SelectItem>
                <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                <SelectItem value="100k+">$100,000+</SelectItem>
                <SelectItem value="discuss">Prefer to Discuss</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Don't worry - pricing is custom-fitted to your project and budget
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="budgetFlexibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Budget Flexibility</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="How flexible is your budget?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="strict">Strict Budget (Cannot exceed)</SelectItem>
                <SelectItem value="some-flexibility">Some Flexibility (±10-20%)</SelectItem>
                <SelectItem value="flexible">Flexible (Quality over cost)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ongoingMaintenance"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Ongoing Maintenance & Support</FormLabel>
              <FormDescription>
                Regular updates, bug fixes, and technical support after launch
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hostingPreferences"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hosting Preferences</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select hosting preference" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cloud">Cloud Hosting (Recommended)</SelectItem>
                <SelectItem value="dedicated">Dedicated Server</SelectItem>
                <SelectItem value="no-preference">No Preference</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="additionalNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Notes or Requirements</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Anything else we should know? Special requirements, concerns, or questions..."
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="referralSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How did you hear about us?</FormLabel>
            <FormControl>
              <Input placeholder="Google, LinkedIn, Referral, etc." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newsletter"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Subscribe to Newsletter</FormLabel>
              <FormDescription>
                Get updates on web development tips, case studies, and special offers
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

// Step 7: Review
function Step7Review({ form, watchedValues }: { form: any; watchedValues: any }) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Review Your Assessment
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please review your answers before submitting. You can go back to make changes.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Contact Information</h4>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <p><strong>Name:</strong> {watchedValues.name}</p>
            <p><strong>Email:</strong> {watchedValues.email}</p>
            {watchedValues.phone && <p><strong>Phone:</strong> {watchedValues.phone}</p>}
            {watchedValues.company && <p><strong>Company:</strong> {watchedValues.company}</p>}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Project Details</h4>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <p><strong>Project Name:</strong> {watchedValues.projectName}</p>
            <p><strong>Type:</strong> {watchedValues.projectType?.replace("-", " ")}</p>
            <p><strong>Description:</strong> {watchedValues.projectDescription}</p>
            <p><strong>Target Audience:</strong> {watchedValues.targetAudience}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Technical Requirements</h4>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <p><strong>Platforms:</strong> {watchedValues.platform?.join(", ")}</p>
            <p><strong>Must-Have Features:</strong> {watchedValues.mustHaveFeatures?.join(", ")}</p>
            {watchedValues.userAuthentication && (
              <p><strong>Authentication:</strong> {watchedValues.userAuthentication}</p>
            )}
            {watchedValues.paymentProcessing && <p>✓ Payment Processing</p>}
            {watchedValues.realTimeFeatures && <p>✓ Real-time Features</p>}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2">Timeline & Budget</h4>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <p><strong>Timeline:</strong> {watchedValues.preferredTimeline?.replace(/-/g, " ")}</p>
            <p><strong>Budget Range:</strong> {watchedValues.budgetRange?.replace(/-/g, " - $").replace("under", "Under $").replace("k", "k").replace("discuss", "Prefer to Discuss")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
