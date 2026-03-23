"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, Plus, Trash2, Mail, ListTodo, Calendar, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/newsletter/RichTextEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Step = { type: "email" | "task"; waitDays: number; subject?: string; body?: string; taskTitle?: string; taskType?: string };

export default function NewSequencePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ type: "email", waitDays: 0, subject: "" }]);
  const [triggerType, setTriggerType] = useState<"now" | "scheduled">("now");
  const [scheduledStartAt, setScheduledStartAt] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/crm/sequences", {
        name,
        description: description || null,
        steps: steps.map((s) => ({
          type: s.type,
          waitDays: s.waitDays,
          subject: s.type === "email" ? s.subject : undefined,
          body: s.type === "email" ? s.body : undefined,
          taskTitle: s.type === "task" ? s.taskTitle : undefined,
          taskType: s.type === "task" ? (s.taskType || "follow_up") : undefined,
        })),
        triggerType: triggerType === "scheduled" && scheduledStartAt ? "scheduled" : "now",
        scheduledStartAt: triggerType === "scheduled" && scheduledStartAt ? scheduledStartAt : null,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/sequences"] });
      toast({ title: "Sequence created" });
      router.push("/admin/crm/sequences");
    },
    onError: () => toast({ title: "Failed to create sequence", variant: "destructive" }),
  });

  const addStep = () => setSteps((s) => [...s, { type: "email", waitDays: 2, subject: "" }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, upd: Partial<Step>) => setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...upd } : step)));

  if (authLoading) return <div className="container mx-auto min-w-0 max-w-full px-3 fold:px-4 sm:px-6 py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto min-w-0 px-3 fold:px-4 sm:px-6 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/crm/sequences"><ArrowLeft className="h-4 w-4 mr-2" /> Back to sequences</Link>
      </Button>
      <h1 className="text-2xl font-bold mt-4">New sequence</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Post-demo follow-up" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When to use this sequence" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">When to run</CardTitle>
          <CardDescription>Start sequence when contacts are enrolled, or schedule the first step for a date and time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={triggerType} onValueChange={(v: "now" | "scheduled") => setTriggerType(v)} className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-4 flex-1 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="now" id="trigger-now" />
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Now</p>
                <p className="text-xs text-muted-foreground">Start as soon as contacts are enrolled</p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border p-4 flex-1 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="scheduled" id="trigger-scheduled" />
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Schedule</p>
                <p className="text-xs text-muted-foreground">First step at a specific date & time</p>
              </div>
            </label>
          </RadioGroup>
          {triggerType === "scheduled" && (
            <div className="space-y-2">
              <Label htmlFor="scheduledStartAt">Date & time</Label>
              <Input
                id="scheduledStartAt"
                type="datetime-local"
                value={scheduledStartAt}
                onChange={(e) => setScheduledStartAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Steps</CardTitle>
          <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-4 w-4 mr-2" /> Add step</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  Step {i + 1}
                  {step.type === "email" && <Badge variant="secondary" className="text-xs font-normal gap-1"><Mail className="h-3 w-3" /> Email</Badge>}
                  {step.type === "task" && <Badge variant="outline" className="text-xs font-normal gap-1"><ListTodo className="h-3 w-3" /> Task</Badge>}
                </span>
                <Button variant="ghost" size="sm" onClick={() => removeStep(i)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Delivery type</Label>
                  <Select value={step.type} onValueChange={(v: "email" | "task") => updateStep(i, { type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Wait (days) after previous</Label>
                  <Input type="number" min={0} value={step.waitDays} onChange={(e) => updateStep(i, { waitDays: Number(e.target.value) || 0 })} />
                </div>
              </div>
              {step.type === "email" && (
                <>
                  <div><Label>Subject</Label><Input value={step.subject ?? ""} onChange={(e) => updateStep(i, { subject: e.target.value })} placeholder="Email subject" /></div>
                  <div>
                    <Label>Body (optional) — rich text & media</Label>
                    <div className="mt-1 rounded-md border bg-background min-h-[120px]">
                      <RichTextEditor
                        content={step.body ?? ""}
                        onChange={(html) => updateStep(i, { body: html })}
                        placeholder="Add rich content, links, images..."
                      />
                    </div>
                  </div>
                </>
              )}
              {step.type === "task" && (
                <div><Label>Task title</Label><Input value={step.taskTitle ?? ""} onChange={(e) => updateStep(i, { taskTitle: e.target.value })} placeholder="e.g. Call lead" /></div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || steps.length === 0 || createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create sequence"}
        </Button>
        <Button variant="outline" asChild><Link href="/admin/crm/sequences">Cancel</Link></Button>
      </div>
    </div>
  );
}
