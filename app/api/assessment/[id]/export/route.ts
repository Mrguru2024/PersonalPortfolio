import { NextRequest, NextResponse } from "next/server";
import { db } from "@server/db";
import { projectAssessments } from "@shared/schema";
import { proposalService } from "@server/services/proposalService";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format") || "pdf";

    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessment ID" },
        { status: 400 }
      );
    }

    // Fetch assessment from database
    const [assessment] = await db
      .select()
      .from(projectAssessments)
      .where(eq(projectAssessments.id, assessmentId))
      .limit(1);

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Generate proposal
    const proposal = await proposalService.generateProposal(
      assessment.assessmentData as any,
      assessmentId
    );

    // Generate suggestions
    const suggestions = await proposalService.generateProjectSuggestions(
      assessment.assessmentData as any
    );

    if (format === "txt") {
      const text = formatProposalAsText(proposal, suggestions);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="proposal-${assessmentId}.txt"`,
        },
      });
    }

    if (format === "pdf") {
      // Return HTML that can be printed to PDF
      const html = formatProposalAsHTML(proposal, suggestions);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="proposal-${assessmentId}.html"`,
        },
      });
    }

    if (format === "docx") {
      // For DOCX, we'll return a simple text format that can be opened in Word
      // In production, use a library like 'docx' to generate proper DOCX files
      const text = formatProposalAsText(proposal, suggestions);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="proposal-${assessmentId}.docx"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported format" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error exporting proposal:", error);
    return NextResponse.json(
      { error: "Failed to export proposal", details: error.message },
      { status: 500 }
    );
  }
}

function formatProposalAsText(proposal: any, suggestions: string): string {
  let text = "";
  text += `${proposal.title}\n`;
  text += `${"=".repeat(80)}\n\n`;
  text += `Prepared for: ${proposal.clientName}\n`;
  text += `Email: ${proposal.clientEmail}\n`;
  text += `Date: ${proposal.date}\n\n`;
  text += `${"=".repeat(80)}\n\n`;

  text += `PROJECT OVERVIEW\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Project Name: ${proposal.projectOverview.projectName}\n`;
  text += `Project Type: ${proposal.projectOverview.projectType}\n\n`;
  text += `Description:\n${proposal.projectOverview.description}\n\n`;
  text += `Target Audience:\n${proposal.projectOverview.targetAudience}\n\n`;
  if (proposal.projectOverview.mainGoals.length > 0) {
    text += `Main Goals:\n`;
    proposal.projectOverview.mainGoals.forEach((goal: string, idx: number) => {
      text += `${idx + 1}. ${goal}\n`;
    });
    text += `\n`;
  }

  text += `\n${"=".repeat(80)}\n\n`;
  text += `SCOPE OF WORK\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Platforms: ${proposal.scopeOfWork.platforms.join(", ")}\n\n`;
  text += `Features:\n`;
  proposal.scopeOfWork.features.forEach((feature: string, idx: number) => {
    text += `${idx + 1}. ${feature}\n`;
  });
  text += `\n`;
  if (proposal.scopeOfWork.integrations.length > 0) {
    text += `Integrations:\n`;
    proposal.scopeOfWork.integrations.forEach((integration: string, idx: number) => {
      text += `${idx + 1}. ${integration}\n`;
    });
    text += `\n`;
  }
  text += `Technical Requirements:\n`;
  proposal.scopeOfWork.technicalRequirements.forEach((req: string, idx: number) => {
    text += `${idx + 1}. ${req}\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `PROJECT TIMELINE\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Total Duration: ${proposal.timeline.totalDuration}\n`;
  text += `Estimated Start Date: ${proposal.timeline.startDate}\n\n`;
  proposal.timeline.phases.forEach((phase: any, idx: number) => {
    text += `Phase ${idx + 1}: ${phase.phase} (${phase.duration})\n`;
    phase.deliverables.forEach((deliverable: string) => {
      text += `  • ${deliverable}\n`;
    });
    text += `\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `PRICING BREAKDOWN\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Base Price: $${proposal.pricing.basePrice.toLocaleString()}\n\n`;
  if (proposal.pricing.features.length > 0) {
    text += `Features:\n`;
    proposal.pricing.features.forEach((feature: any) => {
      text += `  ${feature.name} (${feature.category}): +$${feature.price.toLocaleString()}\n`;
    });
    text += `\n`;
  }
  if (proposal.pricing.platform.price > 0) {
    text += `Platform (${proposal.pricing.platform.platforms.join(", ")}): +$${proposal.pricing.platform.price.toLocaleString()}\n`;
  }
  if (proposal.pricing.design.price > 0) {
    text += `Design (${proposal.pricing.design.level}): +$${proposal.pricing.design.price.toLocaleString()}\n`;
  }
  if (proposal.pricing.integrations.price > 0) {
    text += `Integrations (${proposal.pricing.integrations.count}): +$${proposal.pricing.integrations.price.toLocaleString()}\n`;
  }
  if (proposal.pricing.complexity) {
    text += `Complexity (${proposal.pricing.complexity.level}): ×${proposal.pricing.complexity.multiplier}\n`;
  }
  if (proposal.pricing.timeline && proposal.pricing.timeline.rush) {
    text += `Rush Timeline: ×${proposal.pricing.timeline.multiplier}\n`;
  }
  text += `\n`;
  text += `FINAL TOTAL: $${proposal.pricing.finalTotal.toLocaleString()}\n\n`;
  text += `Payment Schedule:\n`;
  proposal.pricing.paymentSchedule.forEach((payment: any, idx: number) => {
    text += `${idx + 1}. ${payment.milestone}: $${payment.amount.toLocaleString()} (${payment.dueDate})\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `DELIVERABLES\n`;
  text += `${"-".repeat(80)}\n`;
  proposal.deliverables.forEach((deliverable: string, idx: number) => {
    text += `${idx + 1}. ${deliverable}\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `PROJECT EXPECTATIONS\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Client Responsibilities:\n`;
  proposal.expectations.clientResponsibilities.forEach((resp: string, idx: number) => {
    text += `${idx + 1}. ${resp}\n`;
  });
  text += `\nOur Commitments:\n`;
  proposal.expectations.ourCommitments.forEach((commitment: string, idx: number) => {
    text += `${idx + 1}. ${commitment}\n`;
  });
  text += `\nCommunication: ${proposal.expectations.communication}\n`;

  if (proposal.domainServices) {
    text += `\n${"=".repeat(80)}\n\n`;
    text += `DOMAIN SERVICES\n`;
    text += `${"-".repeat(80)}\n`;
    text += `${proposal.domainServices.message}\n`;
    text += `${proposal.domainServices.pricing}\n`;
  }

  if (proposal.specialNotes) {
    text += `\n${"=".repeat(80)}\n\n`;
    text += `SPECIAL NOTES\n`;
    text += `${"-".repeat(80)}\n`;
    text += `${proposal.specialNotes}\n`;
  }

  text += `\n${"=".repeat(80)}\n\n`;
  text += `NEXT STEPS\n`;
  text += `${"-".repeat(80)}\n`;
  proposal.nextSteps.forEach((step: string, idx: number) => {
    text += `${idx + 1}. ${step}\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `Prepared by Ascendra Technologies\n`;
  text += `Email: 5epmgllc@gmail.com | Phone: 678-216-5112\n`;

  if (suggestions) {
    text += `\n\n${"=".repeat(80)}\n\n`;
    text += `PROJECT SUGGESTIONS & RECOMMENDATIONS\n`;
    text += `${"=".repeat(80)}\n\n`;
    text += `${suggestions}\n`;
  }

  return text;
}

function formatProposalAsHTML(proposal: any, suggestions: string): string {
  // Return HTML that can be printed to PDF using browser's print functionality
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${proposal.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    h3 { color: #3b82f6; margin-top: 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .section { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f3f4f6; font-weight: bold; }
    .total { font-size: 24px; font-weight: bold; color: #2563eb; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${proposal.title}</h1>
    <p>Prepared for: ${proposal.clientName}</p>
    <p>Email: ${proposal.clientEmail}</p>
    <p>Date: ${proposal.date}</p>
  </div>
  ${formatProposalAsText(proposal, suggestions).replace(/\n/g, '<br>').replace(/=/g, '─')}
</body>
</html>`;
}
