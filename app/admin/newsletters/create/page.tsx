"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Save, Send, Sparkles, Wand2, Zap, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CreateNewsletterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [content, setContent] = useState("");
  const [plainText, setPlainText] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "friendly" | "urgent">("professional");
  const [aiLength, setAiLength] = useState<"short" | "medium" | "long">("medium");
  const [aiContentPrompt, setAiContentPrompt] = useState("");
  const [aiSubjectPrompt, setAiSubjectPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [generatedSubjects, setGeneratedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const saveMutation = useMutation({
    mutationFn: async (sendNow: boolean) => {
      // Convert HTML to plain text for email clients
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      
      const response = await apiRequest("POST", "/api/admin/newsletters", {
        subject,
        previewText,
        content,
        plainText: textContent,
        status: sendNow ? "draft" : "draft", // Will be updated when sending
      });
      return await response.json();
    },
    onSuccess: (data, sendNow) => {
      toast({
        title: "Success",
        description: sendNow ? "Newsletter created! You can now send it." : "Newsletter saved as draft",
      });
      if (sendNow) {
        router.push(`/admin/newsletters/${data.id}`);
      } else {
        router.push("/admin/newsletters");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save newsletter",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user || !user.isAdmin || !user.adminApproved) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/newsletters">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Newsletters
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mt-4 mb-2">Create Newsletter</h1>
        <p className="text-muted-foreground">
          Build your email campaign with our rich text editor
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Details</CardTitle>
            <CardDescription>Basic information about your newsletter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="subject">Subject Line *</Label>
                <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Generate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>AI-Generated Subject Lines</DialogTitle>
                      <DialogDescription>
                        Enter a topic, generate, then pick a subject line
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subject-topic">Topic</Label>
                        <Input
                          id="subject-topic"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g., Latest web development trends"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject-tone">Tone</Label>
                        <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subject-prompt">Custom instructions (optional)</Label>
                        <Textarea
                          id="subject-prompt"
                          value={aiSubjectPrompt}
                          onChange={(e) => setAiSubjectPrompt(e.target.value)}
                          placeholder="e.g., Focus on urgency, include a number, avoid questions"
                          className="mt-1 min-h-[80px] resize-y"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        disabled={!aiTopic.trim() || isGenerating}
                        onClick={async () => {
                          if (!aiTopic.trim()) return;
                          setIsGenerating(true);
                          setGeneratedSubjects([]);
                          try {
                            const response = await apiRequest("POST", "/api/admin/newsletters/ai/generate-subject", {
                              topic: aiTopic,
                              tone: aiTone,
                              customInstructions: aiSubjectPrompt.trim() || undefined,
                            });
                            const data = await response.json();
                            const lines = Array.isArray(data.subjectLines)
                              ? data.subjectLines
                              : Array.isArray(data.subjects)
                                ? data.subjects
                                : typeof data.subjectLines === "string"
                                  ? data.subjectLines.split("\n").map((s: string) => s.trim()).filter(Boolean)
                                  : [];
                            setGeneratedSubjects(lines);
                          } catch (error: any) {
                            toast({
                              title: "Generation failed",
                              description: error.message || "Failed to generate subject lines",
                              variant: "destructive",
                            });
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate subject lines"
                        )}
                      </Button>
                      {isGenerating && (
                        <p className="text-sm text-muted-foreground">Generating subject lines...</p>
                      )}
                      {!isGenerating && generatedSubjects.length > 0 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          <Label>Pick one</Label>
                          {generatedSubjects.map((subj, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              className="w-full justify-start text-left h-auto py-3"
                              onClick={() => {
                                setSubject(subj);
                                setShowSubjectDialog(false);
                              }}
                            >
                              {subj}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="preview-text">Preview Text</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!subject.trim()) {
                      toast({
                        title: "Subject required",
                        description: "Please enter a subject line first",
                        variant: "destructive",
                      });
                      return;
                    }
                    setIsGenerating(true);
                    try {
                      const response = await apiRequest("POST", "/api/admin/newsletters/ai/generate-preview", {
                        subject,
                        content: content.substring(0, 500),
                      });
                      const data = await response.json();
                      setPreviewText(data.previewText || "");
                      toast({
                        title: "Preview text generated",
                        description: "AI-generated preview text has been added",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Generation failed",
                        description: error.message || "Failed to generate preview text",
                        variant: "destructive",
                      });
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating || !subject.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Generate
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="preview-text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Short preview text shown in email clients..."
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This text appears after the subject line in most email clients
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content</CardTitle>
                <CardDescription>Write your newsletter content using the rich text editor</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isGenerating}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI Generate
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>AI Content Generation</DialogTitle>
                      <DialogDescription>
                        Generate newsletter content using AI
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ai-topic">Topic *</Label>
                        <Input
                          id="ai-topic"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g., Latest web development trends"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ai-tone">Tone</Label>
                          <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ai-length">Length</Label>
                          <Select value={aiLength} onValueChange={(value: any) => setAiLength(value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">Short (200-300 words)</SelectItem>
                              <SelectItem value="medium">Medium (400-600 words)</SelectItem>
                              <SelectItem value="long">Long (800-1000 words)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ai-content-prompt">Custom instructions (optional)</Label>
                        <Textarea
                          id="ai-content-prompt"
                          value={aiContentPrompt}
                          onChange={(e) => setAiContentPrompt(e.target.value)}
                          placeholder="e.g., Include a CTA, mention our product launch, keep paragraphs short"
                          className="mt-1 min-h-[80px] resize-y"
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setAiTopic("")}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!aiTopic.trim()) {
                              toast({
                                title: "Topic required",
                                description: "Please enter a topic",
                                variant: "destructive",
                              });
                              return;
                            }
                            setIsGenerating(true);
                            try {
                              const topicToSend = (aiTopic || "").trim();
                            if (!topicToSend) {
                              toast({
                                title: "Topic required",
                                description: "Enter or select a topic above, or in this dialog",
                                variant: "destructive",
                              });
                              return;
                            }
                            const response = await apiRequest("POST", "/api/admin/newsletters/ai/generate-content", {
                                topic: topicToSend,
                                length: aiLength,
                                tone: aiTone,
                                customInstructions: aiContentPrompt.trim() || undefined,
                              });
                              const data = await response.json();
                              const html =
                                typeof data?.content === "string"
                                  ? data.content
                                  : typeof data?.data?.content === "string"
                                    ? data.data.content
                                    : "";
                              setContent(html);
                              toast({
                                title: "Content generated",
                                description: html ? "AI content has been added to the editor" : "No content returned",
                              });
                            } catch (error: any) {
                              toast({
                                title: "Generation failed",
                                description: error.message || "Failed to generate content",
                                variant: "destructive",
                              });
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                          disabled={isGenerating || !aiTopic.trim()}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {content && (
                  <Select
                    onValueChange={async (value) => {
                      if (!content.trim()) return;
                      setIsGenerating(true);
                      try {
                        const response = await apiRequest("POST", "/api/admin/newsletters/ai/improve-content", {
                          content,
                          instruction: value,
                        });
                        const data = await response.json();
                        const html =
                          typeof data?.content === "string"
                            ? data.content
                            : typeof data?.data?.content === "string"
                              ? data.data.content
                              : "";
                        setContent(html);
                        toast({
                          title: "Content improved",
                          description: `Content has been ${value}d`,
                        });
                      } catch (error: any) {
                        toast({
                          title: "Improvement failed",
                          description: error.message || "Failed to improve content",
                          variant: "destructive",
                        });
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Improve content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="improve">Improve</SelectItem>
                      <SelectItem value="expand">Expand</SelectItem>
                      <SelectItem value="make-more-engaging">Make Engaging</SelectItem>
                      <SelectItem value="summarize">Summarize</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <Label className="text-base font-medium">Topic for AI generation</Label>
              <p className="text-sm text-muted-foreground">
                Choose a topic or type your own, then click &quot;AI Generate&quot; above to create content.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Select
                  value={
                    ["Product update", "Company news", "Tips and how-tos", "Event announcement", "Industry trends"].includes(aiTopic)
                      ? aiTopic
                      : "custom"
                  }
                  onValueChange={(v) => setAiTopic(v === "custom" ? aiTopic : v)}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product update">Product update</SelectItem>
                    <SelectItem value="Company news">Company news</SelectItem>
                    <SelectItem value="Tips and how-tos">Tips and how-tos</SelectItem>
                    <SelectItem value="Event announcement">Event announcement</SelectItem>
                    <SelectItem value="Industry trends">Industry trends</SelectItem>
                    <SelectItem value="custom">Custom (type below)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="ai-topic-main"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Latest web development trends"
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your newsletter content..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/newsletters")}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate(false)}
            disabled={!subject || !content || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
