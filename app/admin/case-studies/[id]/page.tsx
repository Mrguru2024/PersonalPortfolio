import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStudyEditor } from "@/components/admin/case-studies/CaseStudyEditor";

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseStudyId = Number.parseInt(id, 10);
  if (Number.isNaN(caseStudyId)) {
    notFound();
  }

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
      <CaseStudyEditor caseStudyId={caseStudyId} />
    </div>
  );
}
