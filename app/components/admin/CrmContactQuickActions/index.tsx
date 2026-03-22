"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Target,
  CheckSquare,
  User,
  Video,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { intentLevelLabel } from "@/lib/crm-intent";
import { mailtoLeadHref, smsHref, telHref } from "@/lib/crmContactOutreach";

const INTENT_MENU_ORDER = ["hot_lead", "high_intent", "moderate_intent", "low_intent"] as const;

export interface CrmContactQuickActionsContact {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  intentLevel?: string | null;
}

export interface CrmContactQuickActionsProps {
  contact: CrmContactQuickActionsContact;
  /** Icon-only trigger (fits dense list rows). */
  trigger?: "icon" | "labeled";
}

export function CrmContactQuickActions({ contact, trigger = "icon" }: CrmContactQuickActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDue, setTaskDue] = useState("");

  const mailto = mailtoLeadHref(contact.email);
  const tel = telHref(contact.phone);
  const sms = smsHref(contact.phone);

  const invalidateLeadQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contact.id] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts", contact.id, "timeline"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/tasks"] });
  };

  const intentMutation = useMutation({
    mutationFn: async (intentLevel: string | null) => {
      const res = await apiRequest("PATCH", `/api/admin/crm/contacts/${contact.id}`, { intentLevel });
      return res.json();
    },
    onSuccess: () => {
      invalidateLeadQueries();
      toast({ title: "Intent updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const noteMutation = useMutation({
    mutationFn: async () => {
      const body = noteBody.trim();
      if (!body) throw new Error("Enter a note");
      const res = await apiRequest("POST", "/api/admin/crm/activities", {
        contactId: contact.id,
        type: "note",
        subject: `Note — ${contact.name}`,
        body,
      });
      return res.json();
    },
    onSuccess: () => {
      setNoteBody("");
      setNoteOpen(false);
      invalidateLeadQueries();
      toast({ title: "Note added" });
    },
    onError: (e: Error) => toast({ title: "Could not save note", description: e.message, variant: "destructive" }),
  });

  const taskMutation = useMutation({
    mutationFn: async () => {
      const title = taskTitle.trim() || `Follow up: ${contact.name}`;
      const res = await apiRequest("POST", "/api/admin/crm/tasks", {
        contactId: contact.id,
        type: "follow_up",
        title,
        description: taskDescription.trim() || null,
        priority: "medium",
        dueAt: taskDue ? new Date(taskDue).toISOString() : null,
      });
      return res.json();
    },
    onSuccess: () => {
      setTaskTitle("");
      setTaskDescription("");
      setTaskDue("");
      setTaskOpen(false);
      invalidateLeadQueries();
      toast({ title: "Task created" });
    },
    onError: (e: Error) => toast({ title: "Could not create task", description: e.message, variant: "destructive" }),
  });

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied", description: label });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={trigger === "icon" ? "h-9 w-9 shrink-0 p-0" : "gap-2"}
            aria-label={`Quick actions for ${contact.name}`}
          >
            <MoreHorizontal className="h-4 w-4" />
            {trigger === "labeled" ? <span className="text-xs sm:inline">Actions</span> : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(100vw-2rem,16rem)] z-[100]">
          {mailto ? (
            <DropdownMenuItem asChild>
              <a href={mailto} className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4 shrink-0 opacity-70" />
                Email
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 opacity-70" />
              Email (no address)
            </DropdownMenuItem>
          )}
          {sms ? (
            <DropdownMenuItem asChild>
              <a href={sms} className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                Text / SMS
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
              Text (no phone)
            </DropdownMenuItem>
          )}
          {tel ? (
            <DropdownMenuItem asChild>
              <a href={tel} className="flex items-center gap-2 cursor-pointer">
                <Phone className="h-4 w-4 shrink-0 opacity-70" />
                Call
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 opacity-70" />
              Call (no phone)
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {mailto ? (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                void copyText("Email", contact.email.trim());
              }}
            >
              <Copy className="h-4 w-4 shrink-0 opacity-70" />
              Copy email
            </DropdownMenuItem>
          ) : null}
          {contact.phone?.trim() ? (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                void copyText("Phone", (contact.phone ?? "").trim());
              }}
            >
              <Copy className="h-4 w-4 shrink-0 opacity-70" />
              Copy phone
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setNoteBody("");
              setNoteOpen(true);
            }}
          >
            <FileText className="h-4 w-4 shrink-0 opacity-70" />
            Add note
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setTaskTitle(`Follow up: ${contact.name}`);
              setTaskDescription("");
              setTaskDue("");
              setTaskOpen(true);
            }}
          >
            <CheckSquare className="h-4 w-4 shrink-0 opacity-70" />
            Follow-up task
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0 opacity-70" />
              Set intent
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="z-[110]">
              <DropdownMenuItem
                disabled={intentMutation.isPending}
                onSelect={(e) => {
                  e.preventDefault();
                  intentMutation.mutate(null);
                }}
              >
                Clear intent
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {INTENT_MENU_ORDER.map((level) => (
                <DropdownMenuItem
                  key={level}
                  disabled={intentMutation.isPending}
                  onSelect={(e) => {
                    e.preventDefault();
                    intentMutation.mutate(level);
                  }}
                >
                  {intentLevelLabel(level)}
                  {contact.intentLevel === level ? " ✓" : ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`/admin/crm/${contact.id}`} className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4 shrink-0 opacity-70" />
              Open lead profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/crm/discovery?contactId=${contact.id}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Video className="h-4 w-4 shrink-0 opacity-70" />
              Discovery workspaces
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="w-[min(100%,24rem)] max-h-[min(90dvh,32rem)] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
            <DialogDescription>
              Logged on {contact.name}&apos;s timeline (same as the lead profile).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 min-h-0">
            <Label htmlFor={`quick-note-${contact.id}`}>Note</Label>
            <Textarea
              id={`quick-note-${contact.id}`}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={5}
              placeholder="Call outcome, objection, next step…"
              className="resize-y min-h-[120px]"
            />
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={noteMutation.isPending || !noteBody.trim()}
              onClick={() => noteMutation.mutate()}
            >
              {noteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="w-[min(100%,24rem)] max-h-[min(90dvh,36rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Follow-up task</DialogTitle>
            <DialogDescription>Create a task for this lead. View all tasks under CRM → Tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor={`quick-task-title-${contact.id}`}>Title</Label>
              <Input
                id={`quick-task-title-${contact.id}`}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Follow up: …"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`quick-task-due-${contact.id}`}>Due (optional)</Label>
              <Input
                id={`quick-task-due-${contact.id}`}
                type="datetime-local"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`quick-task-desc-${contact.id}`}>Details (optional)</Label>
              <Textarea
                id={`quick-task-desc-${contact.id}`}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="w-full sm:w-auto" disabled={taskMutation.isPending} onClick={() => taskMutation.mutate()}>
              {taskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
