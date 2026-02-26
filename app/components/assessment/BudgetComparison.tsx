"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Target,
  Zap,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BudgetComparison as BudgetComparisonType } from "@server/services/budgetComparisonService";

interface BudgetComparisonProps {
  assessmentId: number;
}

export function BudgetComparison({ assessmentId }: BudgetComparisonProps) {
  const [comparison, setComparison] = useState<BudgetComparisonType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/assessment/${assessmentId}/comparison`);
        if (response.ok) {
          const data = await response.json();
          setComparison(data.comparison);
        }
      } catch (error) {
        console.error("Error fetching comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchComparison();
    }
  }, [assessmentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Analyzing budget comparison...</p>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Unable to load comparison</p>
        </CardContent>
      </Card>
    );
  }

  const getAlignmentColor = (status: string) => {
    switch (status) {
      case 'aligned':
        return 'text-green-600 dark:text-green-400';
      case 'under-budget':
        return 'text-blue-600 dark:text-blue-400';
      case 'over-budget':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'significantly-over':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAlignmentIcon = (status: string) => {
    switch (status) {
      case 'aligned':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'under-budget':
        return <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'over-budget':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'significantly-over':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const budgetDifference = (comparison.assessmentNeeds.calculatedTotal ?? 0) - (comparison.budgetRange.average ?? 0);
  const percentageDiff = comparison.alignment.percentageDifference;

  return (
    <div className="space-y-6">
      {/* Header - Alignment Status */}
      <Card className={`border-2 ${
        comparison.alignment.status === 'aligned' ? 'border-green-500' :
        comparison.alignment.status === 'under-budget' ? 'border-blue-500' :
        comparison.alignment.status === 'over-budget' ? 'border-yellow-500' :
        'border-red-500'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAlignmentIcon(comparison.alignment.status)}
              <div>
                <CardTitle className={getAlignmentColor(comparison.alignment.status)}>
                  Budget Alignment: {comparison.alignment.status.replace('-', ' ').toUpperCase()}
                </CardTitle>
                <CardDescription className="mt-1">
                  {comparison.alignment.message}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={
                comparison.alignment.status === 'aligned' ? 'default' :
                comparison.alignment.status === 'under-budget' ? 'secondary' :
                'destructive'
              }
              className="text-lg px-4 py-2"
            >
              {percentageDiff > 0 ? '+' : ''}{percentageDiff}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">{comparison.alignment.recommendation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Budget vs Assessment Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget vs Assessment Needs
          </CardTitle>
          <CardDescription>Compare your selected budget with your actual project requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Selected Budget */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Your Selected Budget
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Range</span>
                    <span className="font-bold">
                      ${(comparison.budgetRange.min ?? 0).toLocaleString()} - {comparison.budgetRange.max == null || comparison.budgetRange.max === Infinity ? "∞" : comparison.budgetRange.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average</span>
                    <span className="font-bold text-lg">${(comparison.budgetRange.average ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Needs */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Your Project Needs
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Range</span>
                    <span className="font-bold">
                      ${(comparison.assessmentNeeds.estimatedMin ?? 0).toLocaleString()} - ${(comparison.assessmentNeeds.estimatedMax ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Calculated Total</span>
                    <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                      ${(comparison.assessmentNeeds.calculatedTotal ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Difference Visualization */}
          <Separator className="my-6" />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Difference</span>
              <span className={`font-bold text-lg ${budgetDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {budgetDifference > 0 ? '+' : ''}${Math.abs(budgetDifference).toLocaleString()}
              </span>
            </div>
            <Progress 
              value={
                comparison.budgetRange.max == null || comparison.budgetRange.max === Infinity
                  ? 50
                  : Math.min(100, ((comparison.assessmentNeeds.calculatedTotal ?? 0) / comparison.budgetRange.max) * 100)
              }
              className="h-3"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Budget: ${(comparison.budgetRange.average ?? 0).toLocaleString()}</span>
              <span>Needs: ${(comparison.assessmentNeeds.calculatedTotal ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Detailed Comparison */}
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="cost">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="value">Value Analysis</TabsTrigger>
        </TabsList>

        {/* Features Comparison */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>Features included vs missing based on your budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Included Features */}
              {comparison.featureComparison.includedInBudget.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Included in Your Budget ({comparison.featureComparison.includedInBudget.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {comparison.featureComparison.includedInBudget.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Features */}
              {comparison.featureComparison.missingFromBudget.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    Missing from Your Budget ({comparison.featureComparison.missingFromBudget.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {comparison.featureComparison.missingFromBudget.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Features */}
              {comparison.featureComparison.recommendedFeatures.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Lightbulb className="h-4 w-4" />
                    Recommended Additional Features
                  </h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {comparison.featureComparison.recommendedFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget-Friendly Alternatives */}
              {comparison.featureComparison.budgetFriendlyAlternatives.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Zap className="h-4 w-4" />
                    Budget-Friendly Alternatives
                  </h3>
                  <div className="space-y-3">
                    {comparison.featureComparison.budgetFriendlyAlternatives.map((alt, idx) => (
                      <div key={idx} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium line-through text-gray-500">{alt.feature}</p>
                            <p className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 mt-1">
                              <ArrowRight className="h-4 w-4" />
                              {alt.alternative}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Save ${(alt.costSavings ?? 0).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown Comparison */}
        <TabsContent value="cost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown Comparison</CardTitle>
              <CardDescription>Detailed cost allocation comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(comparison.costBreakdown.assessmentAllocation)
                  .filter(([key]) => {
                    // Include all cost categories
                    return ['basePrice', 'features', 'platform', 'design', 'integrations', 'complexity', 'timeline'].includes(key);
                  })
                  .map(([key, value]) => {
                    const budgetValue = comparison.costBreakdown.budgetAllocation[key as keyof typeof comparison.costBreakdown.budgetAllocation];
                    const difference = comparison.costBreakdown.differences[key as keyof typeof comparison.costBreakdown.differences];
                    const displayValue = Math.round(value as number);
                    const displayBudgetValue = Math.round(budgetValue as number);
                    const displayDifference = Math.round(difference as number);
                    
                    // Skip if both values are 0
                    if (displayValue === 0 && displayBudgetValue === 0) return null;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">
                            {key === 'basePrice' ? 'Base Price' :
                             key === 'complexity' ? 'Complexity Adjustment' :
                             key === 'timeline' ? 'Timeline Adjustment' :
                             key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Budget: ${displayBudgetValue.toLocaleString()}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-semibold">
                              Needs: ${displayValue.toLocaleString()}
                            </span>
                            {displayDifference !== 0 && (
                              <Badge variant={displayDifference > 0 ? 'destructive' : 'default'} className="ml-2">
                                {displayDifference > 0 ? '+' : ''}${Math.abs(displayDifference).toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(100, Math.max(0, (displayValue / Math.max(comparison.assessmentNeeds.calculatedTotal ?? 1, 1)) * 100))} 
                          className="h-2"
                        />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Value Analysis */}
        <TabsContent value="value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Value Analysis</CardTitle>
              <CardDescription>Compare the value proposition of your budget vs needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Budget Value */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Your Budget Value</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Features per $1,000</p>
                      <p className="text-2xl font-bold">{comparison.valueAnalysis.budgetValue.featuresPerDollar.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quality Level</p>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {comparison.valueAnalysis.budgetValue.qualityLevel}
                      </Badge>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scope Level</p>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {comparison.valueAnalysis.budgetValue.scopeLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Assessment Value */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Your Project Needs Value</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Features per $1,000</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {comparison.valueAnalysis.assessmentValue.featuresPerDollar.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quality Level</p>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {comparison.valueAnalysis.assessmentValue.qualityLevel}
                      </Badge>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scope Level</p>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {comparison.valueAnalysis.assessmentValue.scopeLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Value Recommendations
                </h3>
                <ul className="space-y-2">
                  {comparison.valueAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      {comparison.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recommended Actions
            </CardTitle>
            <CardDescription>Actionable steps to align your budget with your project needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparison.actionItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border-2 ${
                    item.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    item.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {item.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Zap className="h-4 w-4" />
                    <span>{item.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
