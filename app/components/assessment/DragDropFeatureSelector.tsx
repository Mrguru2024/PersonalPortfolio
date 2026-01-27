"use client";

import { useState } from "react";
import { GripVertical, X, AlertCircle, DollarSign, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFeatureBenefit, isFeatureRequired, type FeatureBenefit } from "@/lib/featureBenefits";
import { getFeatureId } from "@/lib/featureMapping";
import type { ProjectAssessment } from "@shared/assessmentSchema";

interface DragDropFeatureSelectorProps {
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  projectType?: string;
  assessmentData?: Partial<ProjectAssessment>;
  onPriceUpdate?: (newPrice: number) => void;
}

export function DragDropFeatureSelector({
  selectedFeatures,
  onFeaturesChange,
  projectType,
  assessmentData,
  onPriceUpdate,
}: DragDropFeatureSelectorProps) {
  const [draggedFeature, setDraggedFeature] = useState<string | null>(null);
  const [removalCandidate, setRemovalCandidate] = useState<{
    feature: string;
    benefit: FeatureBenefit;
    costSavings: number;
  } | null>(null);

  const handleRemoveFeature = (featureName: string) => {
    // Try to get feature ID from mapping
    const featureId = getFeatureId(featureName) || featureName.toLowerCase().replace(/\s+/g, '-');
    const benefit = getFeatureBenefit(featureId);
    
    // If no benefit found, still allow removal but without detailed explanation
    if (!benefit) {
      // Still allow removal, just without the detailed popup
      const newFeatures = selectedFeatures.filter(f => f !== featureName);
      onFeaturesChange(newFeatures);
      return;
    }

    // Check if feature is required
    if (isFeatureRequired(featureId, projectType)) {
      // Show alert that it's required
      return;
    }

    // Calculate cost savings
    const costSavings = benefit.costSavings || 0;

    // Show confirmation dialog with benefit explanation
    setRemovalCandidate({
      feature: featureName,
      benefit,
      costSavings,
    });
  };

  const confirmRemoval = async () => {
    if (!removalCandidate) return;

    const newFeatures = selectedFeatures.filter(f => f !== removalCandidate.feature);
    onFeaturesChange(newFeatures);

    // Update price if callback provided
    if (onPriceUpdate && assessmentData) {
      const updatedData = {
        ...assessmentData,
        mustHaveFeatures: newFeatures,
      };
      
      try {
        const response = await fetch("/api/assessment/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        const data = await response.json();
        if (data.success && data.pricing) {
          const averagePrice = data.pricing.estimatedRange?.average || 
                             ((data.pricing.estimatedRange?.min || 0) + (data.pricing.estimatedRange?.max || 0)) / 2;
          onPriceUpdate(averagePrice);
        }
      } catch (error) {
        console.error("Error updating price:", error);
      }
    }

    setRemovalCandidate(null);
  };

  const handleDragStart = (featureId: string) => {
    setDraggedFeature(featureId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFeature) {
      handleRemoveFeature(draggedFeature);
      setDraggedFeature(null);
    }
  };

  if (selectedFeatures.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <p>No features selected yet. Features will appear here once you select them.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Selected Features
          </CardTitle>
          <CardDescription>
            Drag features to the remove area below, or click the X button to remove them. 
            Required features cannot be removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedFeatures.map((featureName) => {
            const featureId = getFeatureId(featureName) || featureName.toLowerCase().replace(/\s+/g, '-');
            const benefit = getFeatureBenefit(featureId);
            const isRequired = isFeatureRequired(featureId, projectType);
            const displayName = benefit?.name || featureName;

            return (
              <div
                key={featureId}
                draggable={!isRequired}
                onDragStart={() => handleDragStart(featureId)}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 transition-all
                  ${isRequired 
                    ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 cursor-not-allowed' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-move hover:border-primary hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  {!isRequired && (
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  )}
                  {isRequired && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{displayName}</span>
                      {isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {benefit?.costSavings && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {benefit.costSavings.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    {benefit && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {benefit.benefit}
                      </p>
                    )}
                  </div>
                </div>
                {!isRequired && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFeature(featureName)}
                    className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Drop Zone for Removal */}
      <Card 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed transition-all
          ${draggedFeature ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}
        `}
      >
        <CardContent className="py-8 text-center">
          <X className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag features here to remove them
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Required features cannot be removed
          </p>
        </CardContent>
      </Card>

      {/* Removal Confirmation Dialog */}
      <AlertDialog open={!!removalCandidate} onOpenChange={() => setRemovalCandidate(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Remove Feature: {removalCandidate?.benefit.name}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                        What You're Losing:
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                        {removalCandidate?.benefit.benefit}
                      </p>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                        Real-World Impact:
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        {removalCandidate?.benefit.realWorldImpact}
                      </p>
                    </div>
                  </div>
                </div>

                {removalCandidate?.costSavings && removalCandidate.costSavings > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-200">
                          Cost Savings
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-300">
                          Removing this feature will reduce your project cost
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          -${removalCandidate.costSavings.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Tip:</strong> You can always add this feature back later if needed. 
                    Consider your budget and whether this feature is essential for your initial launch.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Feature</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoval}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Feature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
