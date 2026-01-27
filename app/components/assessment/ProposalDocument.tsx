"use client";

import { useState, useEffect } from "react";
import { Download, FileText, File, FileType, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProposalDocument as ProposalDocType } from "@server/services/proposalService";

interface ProposalDocumentProps {
  assessmentId: number;
}

export function ProposalDocument({ assessmentId }: ProposalDocumentProps) {
  const [proposal, setProposal] = useState<ProposalDocType | null>(null);
  const [suggestions, setSuggestions] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const [proposalRes, suggestionsRes] = await Promise.all([
          fetch(`/api/assessment/${assessmentId}/proposal`),
          fetch(`/api/assessment/${assessmentId}/suggestions`),
        ]);

        if (proposalRes.ok) {
          const proposalData = await proposalRes.json();
          setProposal(proposalData.proposal);
        }

        if (suggestionsRes.ok) {
          const suggestionsData = await suggestionsRes.json();
          setSuggestions(suggestionsData.suggestions);
        }
      } catch (error) {
        console.error("Error fetching proposal:", error);
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchProposal();
    }
  }, [assessmentId]);

  const exportAsPDF = () => {
    setExporting("pdf");
    try {
      // Use browser's print to PDF functionality
      const proposalElement = document.getElementById('proposal-document');
      if (!proposalElement) {
        alert('Proposal document not found');
        setExporting(null);
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF. Alternatively, use Ctrl+P (Cmd+P on Mac) to print this page and select "Save as PDF"');
        setExporting(null);
        return;
      }

      const proposalHTML = proposalElement.innerHTML;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Proposal - ${assessmentId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              padding: 40px; 
              line-height: 1.6;
              color: #1f2937;
            }
            h1 { 
              color: #2563eb; 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 10px; 
              margin-bottom: 20px;
              font-size: 2.5rem;
            }
            h2 { 
              color: #1e40af; 
              margin-top: 30px; 
              border-bottom: 2px solid #e5e7eb; 
              padding-bottom: 5px;
              font-size: 1.75rem;
            }
            h3 { 
              color: #3b82f6; 
              margin-top: 20px;
              font-size: 1.25rem;
            }
            .space-y-8 > * + * { margin-top: 2rem; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .border-b { border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; }
            .border { border: 1px solid #e5e7eb; }
            .rounded-lg { border-radius: 0.5rem; }
            .p-4 { padding: 1rem; }
            .p-3 { padding: 0.75rem; }
            .p-2 { padding: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .text-center { text-align: center; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-3xl { font-size: 1.875rem; }
            .text-4xl { font-size: 2.25rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-primary { color: #2563eb; }
            .bg-primary\\/10 { background-color: rgba(37, 99, 235, 0.1); }
            .bg-primary\\/5 { background-color: rgba(37, 99, 235, 0.05); }
            .bg-muted { background-color: #f3f4f6; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-yellow-50 { background-color: #fefce8; }
            .border-primary\\/20 { border-color: rgba(37, 99, 235, 0.2); }
            .border-blue-200 { border-color: #bfdbfe; }
            .border-yellow-200 { border-color: #fde047; }
            .text-blue-900 { color: #1e3a8a; }
            .text-blue-700 { color: #1d4ed8; }
            .text-blue-300 { color: #93c5fd; }
            .text-yellow-600 { color: #ca8a04; }
            .list-disc { list-style-type: disc; }
            .list-inside { list-style-position: inside; }
            .list-decimal { list-style-type: decimal; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .gap-2 { gap: 0.5rem; }
            .gap-4 { gap: 1rem; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            @media print {
              body { padding: 20px; }
              .no-print { display: none !important; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${proposalHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 250);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert('Error generating PDF. Please try using the browser\'s print function (Ctrl+P / Cmd+P on Mac) and select "Save as PDF"');
      setExporting(null);
    }
  };

  const exportAsTXT = () => {
    setExporting("txt");
    try {
      const text = formatProposalAsText(proposal, suggestions);
      const blob = new Blob([text], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposal-${assessmentId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting TXT:", error);
    } finally {
      setExporting(null);
    }
  };

  const exportAsDOCX = async () => {
    setExporting("docx");
    try {
      const response = await fetch(`/api/assessment/${assessmentId}/export?format=docx`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposal-${assessmentId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting DOCX:", error);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Generating your proposal...</p>
        </CardContent>
      </Card>
    );
  }

  if (!proposal) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Unable to load proposal</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Download Proposal</CardTitle>
          <CardDescription>Export your proposal in your preferred format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={exportAsPDF}
              disabled={!!exporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Print/Save as PDF
            </Button>
            <Button
              onClick={exportAsTXT}
              disabled={!!exporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exporting === "txt" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <File className="h-4 w-4" />
              )}
              Export as TXT
            </Button>
            <Button
              onClick={exportAsDOCX}
              disabled={!!exporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exporting === "docx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileType className="h-4 w-4" />
              )}
              Export as DOCX
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Document */}
      <Card className="print:shadow-none" id="proposal-document">
        <CardContent className="p-8 print:p-6">
          <div className="proposal-document space-y-8 print:space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-4xl font-bold mb-2">{proposal.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Prepared for {proposal.clientName}
              </p>
              <p className="text-sm text-gray-500 mt-2">Date: {proposal.date}</p>
            </div>

            {/* Project Overview */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Project Name:</span> {proposal.projectOverview.projectName}
                </div>
                <div>
                  <span className="font-semibold">Project Type:</span>{" "}
                  <Badge variant="outline" className="ml-2">
                    {proposal.projectOverview.projectType}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {proposal.projectOverview.description}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Target Audience:</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {proposal.projectOverview.targetAudience}
                  </p>
                </div>
                {proposal.projectOverview.mainGoals.length > 0 && (
                  <div>
                    <span className="font-semibold">Main Goals:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {proposal.projectOverview.mainGoals.map((goal, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-300">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Scope of Work */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Scope of Work</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {proposal.scopeOfWork.platforms.map((platform, idx) => (
                      <Badge key={idx} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {proposal.scopeOfWork.features.map((feature, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                {proposal.scopeOfWork.integrations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Integrations</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {proposal.scopeOfWork.integrations.map((integration, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-300">
                          {integration}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Technical Requirements</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {proposal.scopeOfWork.technicalRequirements.map((req, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Timeline */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Project Timeline</h2>
              <div className="mb-4">
                <p className="text-lg">
                  <span className="font-semibold">Total Duration:</span> {proposal.timeline.totalDuration}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="font-semibold">Estimated Start Date:</span> {proposal.timeline.startDate}
                </p>
              </div>
              <div className="space-y-4">
                {proposal.timeline.phases.map((phase, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{phase.phase}</h3>
                      <Badge variant="outline">{phase.duration}</Badge>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {phase.deliverables.map((deliverable, dIdx) => (
                        <li key={dIdx} className="text-gray-700 dark:text-gray-300 text-sm">
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Pricing */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Pricing Breakdown</h2>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Base Price</span>
                    <span className="font-bold">${proposal.pricing.basePrice.toLocaleString()}</span>
                  </div>
                </div>

                {proposal.pricing.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Features</h3>
                    <div className="space-y-2">
                      {proposal.pricing.features.map((feature, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <span className="font-medium">{feature.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {feature.category}
                            </Badge>
                          </div>
                          <span className="font-semibold">+${feature.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {proposal.pricing.platform.price > 0 && (
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">
                      Platform: {proposal.pricing.platform.platforms.join(", ")}
                    </span>
                    <span className="font-semibold">+${proposal.pricing.platform.price.toLocaleString()}</span>
                  </div>
                )}

                {proposal.pricing.design.price > 0 && (
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">Design: {proposal.pricing.design.level}</span>
                    <span className="font-semibold">+${proposal.pricing.design.price.toLocaleString()}</span>
                  </div>
                )}

                {proposal.pricing.integrations.price > 0 && (
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="font-medium">
                      Integrations ({proposal.pricing.integrations.count})
                    </span>
                    <span className="font-semibold">
                      +${proposal.pricing.integrations.price.toLocaleString()}
                    </span>
                  </div>
                )}

                {proposal.pricing.complexity && (
                  <div className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">Complexity: {proposal.pricing.complexity.level}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {proposal.pricing.complexity.description}
                      </p>
                    </div>
                    <span className="font-semibold">×{proposal.pricing.complexity.multiplier}</span>
                  </div>
                )}

                {proposal.pricing.timeline && proposal.pricing.timeline.rush && (
                  <div className="flex justify-between items-center p-2 border rounded bg-yellow-50 dark:bg-yellow-900/20">
                    <div>
                      <span className="font-medium">Rush Timeline</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {proposal.pricing.timeline.description}
                      </p>
                    </div>
                    <span className="font-semibold text-yellow-600">×{proposal.pricing.timeline.multiplier}</span>
                  </div>
                )}

                <Separator />

                <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Final Total</span>
                    <span className="text-3xl font-bold text-primary">
                      ${proposal.pricing.finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Payment Schedule</h3>
                  <div className="space-y-2">
                    {proposal.pricing.paymentSchedule.map((payment, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{payment.milestone}</span>
                          <p className="text-xs text-gray-500 mt-1">{payment.dueDate}</p>
                        </div>
                        <span className="font-bold">${payment.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Deliverables */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Deliverables</h2>
              <ul className="list-disc list-inside space-y-2">
                {proposal.deliverables.map((deliverable, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">
                    {deliverable}
                  </li>
                ))}
              </ul>
            </section>

            <Separator />

            {/* Expectations */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Project Expectations</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Client Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {proposal.expectations.clientResponsibilities.map((resp, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Our Commitments</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {proposal.expectations.ourCommitments.map((commitment, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                        {commitment}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Communication:</span> {proposal.expectations.communication}
                </p>
              </div>
            </section>

            {/* Domain Services */}
            {proposal.domainServices && (
              <>
                <Separator />
                <section>
                  <h2 className="text-2xl font-bold mb-4">Domain Services</h2>
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                    <p className="mb-2">{proposal.domainServices.message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {proposal.domainServices.pricing}
                    </p>
                  </div>
                </section>
              </>
            )}

            {/* Special Notes */}
            {proposal.specialNotes && (
              <>
                <Separator />
                <section>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {proposal.specialNotes}
                    </pre>
                  </div>
                </section>
              </>
            )}

            <Separator />

            {/* Next Steps */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
              <ol className="list-decimal list-inside space-y-2">
                {proposal.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            {/* Footer */}
            <div className="border-t pt-6 mt-8 text-center text-sm text-gray-500">
              <p>Prepared by Ascendra Technologies</p>
              <p>Email: 5epmgllc@gmail.com | Phone: 678-216-5112</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Suggestions */}
      {suggestions && (
        <Card>
          <CardHeader>
            <CardTitle>Project Suggestions & Recommendations</CardTitle>
            <CardDescription>Additional insights and recommendations for your project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {suggestions}
              </pre>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => {
                  const blob = new Blob([suggestions], { type: "text/plain" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `project-suggestions-${assessmentId}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Suggestions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatProposalAsText(proposal: ProposalDocType | null, suggestions: string): string {
  if (!proposal) return "";

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
    proposal.projectOverview.mainGoals.forEach((goal, idx) => {
      text += `${idx + 1}. ${goal}\n`;
    });
    text += `\n`;
  }

  text += `\n${"=".repeat(80)}\n\n`;
  text += `SCOPE OF WORK\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Platforms: ${proposal.scopeOfWork.platforms.join(", ")}\n\n`;
  text += `Features:\n`;
  proposal.scopeOfWork.features.forEach((feature, idx) => {
    text += `${idx + 1}. ${feature}\n`;
  });
  text += `\n`;
  if (proposal.scopeOfWork.integrations.length > 0) {
    text += `Integrations:\n`;
    proposal.scopeOfWork.integrations.forEach((integration, idx) => {
      text += `${idx + 1}. ${integration}\n`;
    });
    text += `\n`;
  }
  text += `Technical Requirements:\n`;
  proposal.scopeOfWork.technicalRequirements.forEach((req, idx) => {
    text += `${idx + 1}. ${req}\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `PROJECT TIMELINE\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Total Duration: ${proposal.timeline.totalDuration}\n`;
  text += `Estimated Start Date: ${proposal.timeline.startDate}\n\n`;
  proposal.timeline.phases.forEach((phase, idx) => {
    text += `Phase ${idx + 1}: ${phase.phase} (${phase.duration})\n`;
    phase.deliverables.forEach((deliverable) => {
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
    proposal.pricing.features.forEach((feature) => {
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
  proposal.pricing.paymentSchedule.forEach((payment, idx) => {
    text += `${idx + 1}. ${payment.milestone}: $${payment.amount.toLocaleString()} (${payment.dueDate})\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `DELIVERABLES\n`;
  text += `${"-".repeat(80)}\n`;
  proposal.deliverables.forEach((deliverable, idx) => {
    text += `${idx + 1}. ${deliverable}\n`;
  });

  text += `\n${"=".repeat(80)}\n\n`;
  text += `PROJECT EXPECTATIONS\n`;
  text += `${"-".repeat(80)}\n`;
  text += `Client Responsibilities:\n`;
  proposal.expectations.clientResponsibilities.forEach((resp, idx) => {
    text += `${idx + 1}. ${resp}\n`;
  });
  text += `\nOur Commitments:\n`;
  proposal.expectations.ourCommitments.forEach((commitment, idx) => {
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
  proposal.nextSteps.forEach((step, idx) => {
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
