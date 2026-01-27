import { ProjectAssessment } from "@shared/assessmentSchema";
import { pricingService } from "./pricingService";

export interface BudgetComparison {
  budgetRange: {
    selected: string;
    min: number;
    max: number;
    average: number;
  };
  assessmentNeeds: {
    estimatedMin: number;
    estimatedMax: number;
    average: number;
    calculatedTotal: number;
  };
  alignment: {
    status: 'aligned' | 'under-budget' | 'over-budget' | 'significantly-over';
    percentageDifference: number;
    message: string;
    recommendation: string;
  };
  featureComparison: {
    includedInBudget: string[];
    missingFromBudget: string[];
    recommendedFeatures: string[];
    budgetFriendlyAlternatives: Array<{
      feature: string;
      alternative: string;
      costSavings: number;
    }>;
  };
  costBreakdown: {
    budgetAllocation: {
      basePrice: number;
      features: number;
      platform: number;
      design: number;
      integrations: number;
      complexity: number;
      timeline: number;
    };
    assessmentAllocation: {
      basePrice: number;
      features: number;
      platform: number;
      design: number;
      integrations: number;
      complexity: number;
      timeline: number;
    };
    differences: {
      basePrice: number;
      features: number;
      platform: number;
      design: number;
      integrations: number;
      complexity: number;
      timeline: number;
    };
  };
  valueAnalysis: {
    budgetValue: {
      featuresPerDollar: number;
      qualityLevel: string;
      scopeLevel: string;
    };
    assessmentValue: {
      featuresPerDollar: number;
      qualityLevel: string;
      scopeLevel: string;
    };
    recommendations: string[];
  };
  actionItems: Array<{
    type: 'increase-budget' | 'reduce-scope' | 'phase-project' | 'optimize-features';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
  }>;
}

export class BudgetComparisonService {
  /**
   * Compare user's selected budget with their actual assessment needs
   */
  compareBudgetVsAssessment(assessment: ProjectAssessment): BudgetComparison {
    const pricingBreakdown = pricingService.calculatePricing(assessment);
    const budgetRange = this.getBudgetRange(assessment.budgetRange);
    const assessmentTotal = this.calculateAssessmentTotal(pricingBreakdown);
    
    // Calculate alignment
    const alignment = this.calculateAlignment(budgetRange, assessmentTotal);
    
    // Feature comparison
    const featureComparison = this.compareFeatures(assessment, budgetRange, assessmentTotal);
    
    // Cost breakdown comparison
    const costBreakdown = this.compareCostBreakdown(pricingBreakdown, budgetRange, assessmentTotal);
    
    // Value analysis
    const valueAnalysis = this.analyzeValue(assessment, budgetRange, assessmentTotal, pricingBreakdown);
    
    // Action items
    const actionItems = this.generateActionItems(alignment, featureComparison, costBreakdown, assessment);
    
    return {
      budgetRange: {
        selected: assessment.budgetRange || 'discuss',
        min: budgetRange.min,
        max: budgetRange.max,
        average: (budgetRange.min + budgetRange.max) / 2,
      },
      assessmentNeeds: {
        estimatedMin: pricingBreakdown.estimatedRange.min,
        estimatedMax: pricingBreakdown.estimatedRange.max,
        average: (pricingBreakdown.estimatedRange.min + pricingBreakdown.estimatedRange.max) / 2,
        calculatedTotal: assessmentTotal,
      },
      alignment,
      featureComparison,
      costBreakdown,
      valueAnalysis,
      actionItems,
    };
  }

  private getBudgetRange(budgetRange?: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      'under-5k': { min: 0, max: 5000 },
      '1-2k': { min: 1000, max: 2000 },
      '2-5k': { min: 2000, max: 5000 },
      '5k-10k': { min: 5000, max: 10000 },
      '10k-25k': { min: 10000, max: 25000 },
      '25k-50k': { min: 25000, max: 50000 },
      '50k-100k': { min: 50000, max: 100000 },
      '100k+': { min: 100000, max: 500000 },
      'discuss': { min: 0, max: Infinity },
    };
    
    return ranges[budgetRange || 'discuss'] || ranges['discuss'];
  }

  private calculateAssessmentTotal(pricingBreakdown: any): number {
    let total = pricingBreakdown.basePrice || 0;
    
    // Add feature costs
    if (pricingBreakdown.features && Array.isArray(pricingBreakdown.features)) {
      total += pricingBreakdown.features.reduce((sum: number, f: any) => sum + (f.price || 0), 0);
    }
    
    // Add platform costs
    if (pricingBreakdown.platform?.price) {
      total += pricingBreakdown.platform.price;
    }
    
    // Add design costs
    if (pricingBreakdown.design?.price) {
      total += pricingBreakdown.design.price;
    }
    
    // Add integration costs
    if (pricingBreakdown.integrations?.price) {
      total += pricingBreakdown.integrations.price;
    }
    
    // Apply complexity multiplier
    if (pricingBreakdown.complexity?.multiplier) {
      total *= pricingBreakdown.complexity.multiplier;
    }
    
    // Apply timeline multiplier
    if (pricingBreakdown.timeline?.rush && pricingBreakdown.timeline?.multiplier) {
      total *= pricingBreakdown.timeline.multiplier;
    }
    
    return Math.round(total);
  }

  private calculateAlignment(
    budgetRange: { min: number; max: number },
    assessmentTotal: number
  ): BudgetComparison['alignment'] {
    const budgetAverage = (budgetRange.min + budgetRange.max) / 2;
    const budgetMax = budgetRange.max === Infinity ? assessmentTotal * 2 : budgetRange.max;
    const percentageDifference = ((assessmentTotal - budgetAverage) / budgetAverage) * 100;
    
    let status: 'aligned' | 'under-budget' | 'over-budget' | 'significantly-over';
    let message: string;
    let recommendation: string;
    
    if (assessmentTotal <= budgetRange.max && assessmentTotal >= budgetRange.min) {
      status = 'aligned';
      message = `Your budget aligns well with your project needs. The estimated cost ($${assessmentTotal.toLocaleString()}) fits within your selected budget range.`;
      recommendation = 'Your budget is well-aligned. You can proceed with confidence that your project scope matches your financial expectations.';
    } else if (assessmentTotal < budgetRange.min) {
      status = 'under-budget';
      const savings = budgetRange.min - assessmentTotal;
      message = `Great news! Your project needs ($${assessmentTotal.toLocaleString()}) are below your minimum budget ($${budgetRange.min.toLocaleString()}). You could save up to $${savings.toLocaleString()} or invest in additional features.`;
      recommendation = `Consider adding premium features, enhanced design, or additional integrations to maximize value within your budget.`;
    } else if (assessmentTotal <= budgetMax * 1.2) {
      status = 'over-budget';
      const gap = assessmentTotal - budgetRange.max;
      message = `Your project needs ($${assessmentTotal.toLocaleString()}) exceed your selected budget ($${budgetRange.max.toLocaleString()}) by approximately $${gap.toLocaleString()}.`;
      recommendation = 'Consider phasing the project, reducing scope, or increasing your budget to align with your requirements.';
    } else {
      status = 'significantly-over';
      const gap = assessmentTotal - budgetRange.max;
      message = `Your project needs ($${assessmentTotal.toLocaleString()}) significantly exceed your selected budget ($${budgetRange.max.toLocaleString()}) by approximately $${gap.toLocaleString()}.`;
      recommendation = 'We strongly recommend either significantly increasing your budget, phasing the project into multiple stages, or substantially reducing the project scope to align with your budget.';
    }
    
    return {
      status,
      percentageDifference: Math.round(percentageDifference),
      message,
      recommendation,
    };
  }

  private compareFeatures(
    assessment: ProjectAssessment,
    budgetRange: { min: number; max: number },
    assessmentTotal: number
  ): BudgetComparison['featureComparison'] {
    const allFeatures = assessment.mustHaveFeatures || [];
    const budgetAverage = (budgetRange.min + budgetRange.max) / 2;
    const isLowBudget = budgetRange.max < 5000;
    const isOverBudget = assessmentTotal > budgetRange.max;
    
    // Features that can be included in the budget
    const includedInBudget = isOverBudget 
      ? allFeatures.slice(0, Math.max(1, Math.floor(allFeatures.length * (budgetRange.max / assessmentTotal))))
      : allFeatures;
    
    // Features that might be missing
    const missingFromBudget = isOverBudget
      ? allFeatures.slice(includedInBudget.length)
      : [];
    
    // Recommended features based on budget
    const recommendedFeatures: string[] = [];
    if (!isOverBudget && budgetAverage > assessmentTotal) {
      // Budget allows for additional features
      const budgetSurplus = budgetAverage - assessmentTotal;
      if (budgetSurplus > 2000) {
        recommendedFeatures.push('Advanced analytics dashboard');
        recommendedFeatures.push('Mobile app version');
        recommendedFeatures.push('API documentation');
      }
      if (budgetSurplus > 1000) {
        recommendedFeatures.push('Enhanced security features');
        recommendedFeatures.push('Performance optimization');
      }
    }
    
    // Budget-friendly alternatives
    const budgetFriendlyAlternatives: Array<{ feature: string; alternative: string; costSavings: number }> = [];
    if (isOverBudget) {
      // Suggest alternatives for expensive features
      if (assessment.mustHaveFeatures?.includes('Custom CMS')) {
        budgetFriendlyAlternatives.push({
          feature: 'Custom CMS',
          alternative: 'Headless CMS (Contentful/Strapi)',
          costSavings: 3000,
        });
      }
      if (assessment.mustHaveFeatures?.includes('Enterprise SSO')) {
        budgetFriendlyAlternatives.push({
          feature: 'Enterprise SSO',
          alternative: 'Social Login (Google/Facebook)',
          costSavings: 2500,
        });
      }
      if (assessment.platform?.includes('iOS') && assessment.platform?.includes('Android')) {
        budgetFriendlyAlternatives.push({
          feature: 'Native iOS + Android Apps',
          alternative: 'Progressive Web App (PWA)',
          costSavings: 15000,
        });
      }
    }
    
    return {
      includedInBudget,
      missingFromBudget,
      recommendedFeatures,
      budgetFriendlyAlternatives,
    };
  }

  private compareCostBreakdown(
    pricingBreakdown: any,
    budgetRange: { min: number; max: number },
    assessmentTotal: number
  ): BudgetComparison['costBreakdown'] {
    const budgetAverage = (budgetRange.min + budgetRange.max) / 2;
    const budgetMax = budgetRange.max === Infinity ? assessmentTotal * 2 : budgetRange.max;
    
    // Calculate assessment allocation
    const assessmentAllocation = {
      basePrice: pricingBreakdown.basePrice || 0,
      features: pricingBreakdown.features?.reduce((sum: number, f: any) => sum + (f.price || 0), 0) || 0,
      platform: pricingBreakdown.platform?.price || 0,
      design: pricingBreakdown.design?.price || 0,
      integrations: pricingBreakdown.integrations?.price || 0,
      complexity: 0, // Will calculate
      timeline: 0, // Will calculate
    };
    
    // Apply multipliers to get final costs
    const complexityMultiplier = pricingBreakdown.complexity?.multiplier || 1;
    const timelineMultiplier = pricingBreakdown.timeline?.multiplier || 1;
    const baseSubtotal = assessmentAllocation.basePrice + 
                        assessmentAllocation.features + 
                        assessmentAllocation.platform + 
                        assessmentAllocation.design + 
                        assessmentAllocation.integrations;
    
    assessmentAllocation.complexity = baseSubtotal * (complexityMultiplier - 1);
    assessmentAllocation.timeline = (baseSubtotal + assessmentAllocation.complexity) * (timelineMultiplier - 1);
    
    // Calculate budget allocation (proportional if over budget)
    const scaleFactor = assessmentTotal > budgetMax ? budgetMax / assessmentTotal : 1;
    const budgetAllocation = {
      basePrice: assessmentAllocation.basePrice * scaleFactor,
      features: assessmentAllocation.features * scaleFactor,
      platform: assessmentAllocation.platform * scaleFactor,
      design: assessmentAllocation.design * scaleFactor,
      integrations: assessmentAllocation.integrations * scaleFactor,
      complexity: assessmentAllocation.complexity * scaleFactor,
      timeline: assessmentAllocation.timeline * scaleFactor,
    };
    
    // Calculate differences
    const differences = {
      basePrice: assessmentAllocation.basePrice - budgetAllocation.basePrice,
      features: assessmentAllocation.features - budgetAllocation.features,
      platform: assessmentAllocation.platform - budgetAllocation.platform,
      design: assessmentAllocation.design - budgetAllocation.design,
      integrations: assessmentAllocation.integrations - budgetAllocation.integrations,
      complexity: assessmentAllocation.complexity - budgetAllocation.complexity,
      timeline: assessmentAllocation.timeline - budgetAllocation.timeline,
    };
    
    return {
      budgetAllocation,
      assessmentAllocation,
      differences,
    };
  }

  private analyzeValue(
    assessment: ProjectAssessment,
    budgetRange: { min: number; max: number },
    assessmentTotal: number,
    pricingBreakdown: any
  ): BudgetComparison['valueAnalysis'] {
    const budgetAverage = (budgetRange.min + budgetRange.max) / 2;
    const featureCount = (assessment.mustHaveFeatures?.length || 0) + 
                        (assessment.platform?.length || 0) + 
                        (assessment.integrations?.length || 0);
    
    // Budget value
    const budgetFeaturesPerDollar = budgetAverage > 0 ? featureCount / budgetAverage * 1000 : 0;
    const budgetQualityLevel = this.getQualityLevel(budgetAverage, featureCount);
    const budgetScopeLevel = this.getScopeLevel(budgetAverage);
    
    // Assessment value
    const assessmentFeaturesPerDollar = assessmentTotal > 0 ? featureCount / assessmentTotal * 1000 : 0;
    const assessmentQualityLevel = this.getQualityLevel(assessmentTotal, featureCount);
    const assessmentScopeLevel = this.getScopeLevel(assessmentTotal);
    
    // Recommendations
    const recommendations: string[] = [];
    
    if (assessmentTotal > budgetRange.max) {
      recommendations.push('Consider phasing the project to fit your budget while maintaining quality');
      recommendations.push('Prioritize core features and defer nice-to-have features to later phases');
      if (budgetRange.max < 10000) {
        recommendations.push('Explore template-based solutions to reduce custom development costs');
      }
    } else if (assessmentTotal < budgetRange.min) {
      recommendations.push('Your budget allows for premium features and enhanced quality');
      recommendations.push('Consider investing in advanced integrations or mobile app development');
      recommendations.push('You could add professional design services or extended support');
    } else {
      recommendations.push('Your budget and project scope are well-aligned');
      recommendations.push('Consider adding a maintenance and support plan');
    }
    
    return {
      budgetValue: {
        featuresPerDollar: Math.round(budgetFeaturesPerDollar * 100) / 100,
        qualityLevel: budgetQualityLevel,
        scopeLevel: budgetScopeLevel,
      },
      assessmentValue: {
        featuresPerDollar: Math.round(assessmentFeaturesPerDollar * 100) / 100,
        qualityLevel: assessmentQualityLevel,
        scopeLevel: assessmentScopeLevel,
      },
      recommendations,
    };
  }

  private getQualityLevel(total: number, featureCount: number): string {
    const costPerFeature = total / Math.max(1, featureCount);
    if (costPerFeature > 5000) return 'Premium';
    if (costPerFeature > 2000) return 'High';
    if (costPerFeature > 1000) return 'Standard';
    return 'Basic';
  }

  private getScopeLevel(total: number): string {
    if (total > 50000) return 'Enterprise';
    if (total > 25000) return 'Large';
    if (total > 10000) return 'Medium';
    if (total > 5000) return 'Small-Medium';
    return 'Small';
  }

  private generateActionItems(
    alignment: BudgetComparison['alignment'],
    featureComparison: BudgetComparison['featureComparison'],
    costBreakdown: BudgetComparison['costBreakdown'],
    assessment: ProjectAssessment
  ): BudgetComparison['actionItems'] {
    const actionItems: BudgetComparison['actionItems'] = [];
    
    if (alignment.status === 'significantly-over' || alignment.status === 'over-budget') {
      actionItems.push({
        type: 'phase-project',
        priority: 'high',
        title: 'Phase the Project',
        description: 'Break your project into multiple phases to fit your budget while maintaining quality.',
        impact: `Could reduce initial cost by 40-60% while delivering core functionality first.`,
      });
      
      if (featureComparison.budgetFriendlyAlternatives.length > 0) {
        actionItems.push({
          type: 'optimize-features',
          priority: 'high',
          title: 'Use Budget-Friendly Alternatives',
          description: 'Replace expensive features with cost-effective alternatives that still meet your needs.',
          impact: `Could save $${featureComparison.budgetFriendlyAlternatives.reduce((sum, alt) => sum + alt.costSavings, 0).toLocaleString()} while maintaining core functionality.`,
        });
      }
      
      actionItems.push({
        type: 'reduce-scope',
        priority: 'medium',
        title: 'Reduce Project Scope',
        description: 'Prioritize must-have features and defer nice-to-have features to future updates.',
        impact: `Could reduce cost by 20-30% by focusing on core functionality.`,
      });
      
      if (alignment.percentageDifference > 50) {
        actionItems.push({
          type: 'increase-budget',
          priority: 'medium',
          title: 'Consider Increasing Budget',
          description: 'Your project needs significantly exceed your budget. Consider increasing your budget to match your requirements.',
          impact: `Would allow you to include all desired features and maintain high quality standards.`,
        });
      }
    } else if (alignment.status === 'under-budget') {
      actionItems.push({
        type: 'optimize-features',
        priority: 'low',
        title: 'Enhance Project Scope',
        description: 'Your budget allows for additional features and enhancements.',
        impact: `You could add premium features, enhanced design, or extended support within your budget.`,
      });
    }
    
    return actionItems;
  }
}

export const budgetComparisonService = new BudgetComparisonService();
