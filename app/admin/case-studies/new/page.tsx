"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStudyEditor } from "@/components/admin/case-studies/CaseStudyEditor";

export default function NewCaseStudyPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/case-studies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Case Studies
          </Link>
        </Button>
      </div>
      <CaseStudyEditor />
    </div>
  );
}
