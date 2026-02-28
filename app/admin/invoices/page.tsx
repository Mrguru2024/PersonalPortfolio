"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  FileText,
  Plus,
  Send,
  Bell,
  Trash2,
  Edit,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Calendar,
  Mail,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Invoice {
  id: number;
  invoiceNumber: string;
  title: string;
  amount: number;
  status: string;
  dueDate: string | null;
  recipientEmail: string | null;
  hostInvoiceUrl: string | null;
  lastReminderAt: string | null;
  createdAt: string;
  lineItems?: { description: string; amount: number; quantity?: number }[];
}

export default function AdminInvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [crmPickOpen, setCrmPickOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    recipientEmail: "",
    dueDate: "",
    lineItems: [] as {
      description: string;
      amount: string;
      quantity: string;
    }[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const { data: crmContacts = [] } = useQuery<{ id: number; email: string; name: string }[]>({
    queryKey: ["/api/admin/crm/contacts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/crm/contacts");
      return res.json();
    },
    enabled: crmPickOpen,
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/invoices");
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const createMutation = useMutation({
    mutationFn: async (body: {
      title: string;
      amount: number;
      recipientEmail?: string;
      dueDate?: string;
      lineItems?: { description: string; amount: number; quantity?: number }[];
    }) => {
      const res = await apiRequest("POST", "/api/admin/invoices", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Invoice created",
        description: "Draft invoice has been created.",
      });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: Partial<{
        title: string;
        amount: number;
        recipientEmail: string | null;
        dueDate: string | null;
        lineItems: { description: string; amount: number; quantity?: number }[];
      }>;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/invoices/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Invoice updated" });
      setEditing(null);
      resetForm();
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/invoices/${id}/send`);
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Invoice sent",
        description:
          "The recipient will receive an email with the payment link.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const remindMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/invoices/${id}/remind`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Reminder sent",
        description: "A reminder email was sent to the recipient.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Invoice deleted", variant: "destructive" });
      setDeleteId(null);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setForm({
      title: "",
      amount: "",
      recipientEmail: "",
      dueDate: "",
      lineItems: [],
    });
  }

  function openCreate() {
    resetForm();
    setForm((f) => ({
      ...f,
      lineItems: [{ description: "", amount: "", quantity: "1" }],
    }));
    setCreateOpen(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setForm({
      title: inv.title,
      amount: String(inv.amount / 100),
      recipientEmail: inv.recipientEmail || "",
      dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : "",
      lineItems:
        (inv.lineItems?.length ?? 0) > 0
          ? inv.lineItems!.map((l) => ({
              description: l.description,
              amount: String(l.amount / 100),
              quantity: String(l.quantity ?? 1),
            }))
          : [
              {
                description: inv.title,
                amount: String(inv.amount / 100),
                quantity: "1",
              },
            ],
    });
  }

  function submitCreate() {
    const amountCents = Math.round(parseFloat(form.amount || "0") * 100);
    const lineItems =
      form.lineItems.length > 0 &&
      form.lineItems.some((l) => l.description || l.amount)
        ? form.lineItems
            .filter((l) => l.description && l.amount)
            .map((l) => ({
              description: l.description,
              amount: Math.round(parseFloat(l.amount || "0") * 100),
              quantity: parseInt(l.quantity || "1", 10) || 1,
            }))
        : undefined;
    createMutation.mutate({
      title: form.title,
      amount: lineItems
        ? lineItems.reduce((s, l) => s + l.amount * (l.quantity ?? 1), 0)
        : amountCents,
      recipientEmail: form.recipientEmail || undefined,
      dueDate: form.dueDate || undefined,
      lineItems,
    });
  }

  function submitEdit() {
    if (!editing) return;
    const amountCents = Math.round(parseFloat(form.amount || "0") * 100);
    const lineItems =
      form.lineItems.length > 0 &&
      form.lineItems.some((l) => l.description || l.amount)
        ? form.lineItems
            .filter((l) => l.description && l.amount)
            .map((l) => ({
              description: l.description,
              amount: Math.round(parseFloat(l.amount || "0") * 100),
              quantity: parseInt(l.quantity || "1", 10) || 1,
            }))
        : undefined;
    updateMutation.mutate({
      id: editing.id,
      body: {
        title: form.title,
        amount: lineItems
          ? lineItems.reduce((s, l) => s + l.amount * (l.quantity ?? 1), 0)
          : amountCents,
        recipientEmail: form.recipientEmail || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        lineItems,
      },
    });
  }

  const statusVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    draft: "outline",
    sent: "secondary",
    paid: "default",
    overdue: "destructive",
    cancelled: "secondary",
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(cents / 100);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !user.isAdmin || !user.adminApproved) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, send, and manage Stripe invoices
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New invoice
        </Button>
      </div>

      <Card className="border-2 border-violet-500/20 bg-gradient-to-br from-background to-violet-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-500" />
            All invoices
          </CardTitle>
          <CardDescription>
            {invoices.length} total · Drafts can be edited and sent via Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 rounded-xl border-2 border-dashed border-violet-500/30 bg-violet-500/5">
              <FileText className="h-12 w-12 mx-auto text-violet-500/60 mb-4" />
              <p className="text-muted-foreground font-medium">
                No invoices yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first invoice to get started
              </p>
              <Button onClick={openCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-500/30"
                >
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-lg">{inv.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>{inv.invoiceNumber}</span>
                      {inv.recipientEmail && (
                        <>
                          <span>·</span>
                          <Mail className="h-3 w-3 inline" />
                          {inv.recipientEmail}
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={statusVariant[inv.status] ?? "outline"}>
                        {inv.status}
                      </Badge>
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(inv.amount)}
                      </span>
                      {inv.dueDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due {format(new Date(inv.dueDate), "PPP")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {inv.status === "draft" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(inv)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-700"
                          onClick={() => sendMutation.mutate(inv.id)}
                          disabled={
                            sendMutation.isPending || !inv.recipientEmail
                          }
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      </>
                    )}
                    {inv.status === "sent" && inv.hostInvoiceUrl && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={inv.hostInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remindMutation.mutate(inv.id)}
                          disabled={remindMutation.isPending}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Remind
                        </Button>
                      </>
                    )}
                    {inv.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog
        open={createOpen || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit invoice" : "New invoice"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update details. Only draft invoices can be edited."
                : "Create a draft invoice. Add recipient email and send via Stripe when ready."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Project Phase 1"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Recipient email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="client@company.com"
                  value={form.recipientEmail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipientEmail: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => setCrmPickOpen(true)} title="Select from CRM">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            {editing ? (
              <Button
                onClick={submitEdit}
                disabled={updateMutation.isPending || !form.title}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            ) : (
              <Button
                onClick={submitCreate}
                disabled={createMutation.isPending || !form.title}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={crmPickOpen} onOpenChange={setCrmPickOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select from CRM</DialogTitle>
            <DialogDescription>Choose a contact to use as invoice recipient.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {crmContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition"
                onClick={() => {
                  setForm((f) => ({ ...f, recipientEmail: c.email }));
                  setCrmPickOpen(false);
                }}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.email}</div>
              </button>
            ))}
            {crmContacts.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No CRM contacts. Add leads or clients in CRM first.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this draft invoice. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                deleteId !== null && deleteMutation.mutate(deleteId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
