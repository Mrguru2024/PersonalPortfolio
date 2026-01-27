import { z } from 'zod';

// Project Assessment Schema
export const projectAssessmentSchema = z.object({
  // Step 1: Basic Information
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  
  // Step 2: Project Vision & Goals
  projectName: z.string().min(2, "Project name is required"),
  projectType: z.enum([
    "website",
    "web-app",
    "mobile-app",
    "ecommerce",
    "saas",
    "api",
    "other"
  ]),
  projectDescription: z.string().min(50, "Please provide at least 50 characters describing your project"),
  targetAudience: z.string().min(10, "Please describe your target audience"),
  mainGoals: z.array(z.string()).min(1, "Select at least one main goal"),
  successMetrics: z.string().optional(),
  
  // Step 3: Technical Requirements
  platform: z.array(z.enum([
    "web",
    "ios",
    "android",
    "desktop",
    "api-only"
  ])).min(1, "Select at least one platform"),
  preferredTechStack: z.array(z.string()).optional(),
  mustHaveFeatures: z.array(z.string()).min(1, "Select at least one must-have feature"),
  niceToHaveFeatures: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
  thirdPartyServices: z.array(z.string()).optional(),
  dataStorage: z.enum([
    "simple",
    "moderate",
    "complex",
    "enterprise"
  ]).optional(),
  userAuthentication: z.enum([
    "none",
    "basic",
    "social-login",
    "enterprise-sso",
    "custom"
  ]).optional(),
  paymentProcessing: z.boolean().default(false),
  realTimeFeatures: z.boolean().default(false),
  apiRequirements: z.enum([
    "none",
    "internal",
    "public",
    "both"
  ]).optional(),
  
  // Step 4: Design & UX Requirements
  designStyle: z.enum([
    "minimalist",
    "modern",
    "corporate",
    "creative",
    "custom",
    "not-sure"
  ]).optional(),
  hasBrandGuidelines: z.boolean().default(false),
  brandGuidelinesDescription: z.string().optional(),
  responsiveDesign: z.boolean().default(true),
  accessibilityRequirements: z.enum([
    "basic",
    "wcag-aa",
    "wcag-aaa",
    "custom"
  ]).optional(),
  userExperiencePriority: z.enum([
    "speed",
    "features",
    "design",
    "accessibility",
    "balanced"
  ]).optional(),
  contentManagement: z.enum([
    "static",
    "basic-cms",
    "headless-cms",
    "custom-cms"
  ]).optional(),
  
  // Step 5: Business Goals & Metrics
  businessStage: z.enum([
    "idea",
    "mvp",
    "existing-product",
    "scaling"
  ]).optional(),
  primaryBusinessGoal: z.enum([
    "increase-revenue",
    "reduce-costs",
    "improve-efficiency",
    "expand-market",
    "enhance-brand",
    "other"
  ]).optional(),
  expectedUsers: z.enum([
    "0-100",
    "100-1000",
    "1000-10000",
    "10000+",
    "unknown"
  ]).optional(),
  revenueModel: z.enum([
    "subscription",
    "one-time",
    "freemium",
    "advertising",
    "marketplace",
    "other"
  ]).optional(),
  competitiveAdvantage: z.string().optional(),
  
  // Step 6: Timeline & Budget
  preferredTimeline: z.enum([
    "asap",
    "1-3-months",
    "3-6-months",
    "6-12-months",
    "flexible"
  ]).optional(),
  budgetRange: z.enum([
    "under-5k",
    "5k-10k",
    "10k-25k",
    "25k-50k",
    "50k-100k",
    "100k+",
    "discuss"
  ]).optional(),
  budgetFlexibility: z.enum([
    "strict",
    "some-flexibility",
    "flexible"
  ]).optional(),
  ongoingMaintenance: z.boolean().default(false),
  hostingPreferences: z.enum([
    "cloud",
    "dedicated",
    "no-preference"
  ]).optional(),
  
  // Additional Information
  additionalNotes: z.string().optional(),
  referralSource: z.string().optional(),
  newsletter: z.boolean().default(false),
});

export type ProjectAssessment = z.infer<typeof projectAssessmentSchema>;

// Pricing calculation types
export interface PricingBreakdown {
  basePrice: number;
  features: {
    name: string;
    price: number;
    category: string;
  }[];
  complexity: {
    level: string;
    multiplier: number;
    description: string;
  };
  timeline: {
    rush: boolean;
    multiplier: number;
    description: string;
  };
  platform: {
    platforms: string[];
    price: number;
  };
  design: {
    level: string;
    price: number;
  };
  integrations: {
    count: number;
    price: number;
  };
  subtotal: number;
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

// AI Assistance types
export interface AIAssistanceRequest {
  type: 'generate-ideas' | 'suggest-features' | 'clarify-requirements' | 'improve-description';
  context: string;
  currentAnswers?: Partial<ProjectAssessment>;
}

export interface AIAssistanceResponse {
  suggestions: string[];
  improvedText?: string;
  reasoning?: string;
}
