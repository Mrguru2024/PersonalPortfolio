"use client";

import { Suspense } from "react";
import { ProjectAssessmentWizard } from "@/components/assessment/ProjectAssessmentWizard";
import { useSearchParams } from "next/navigation";

function AssessmentPageContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service') || null;
  
  return <ProjectAssessmentWizard serviceId={serviceId} />;
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AssessmentPageContent />
    </Suspense>
  );
}
