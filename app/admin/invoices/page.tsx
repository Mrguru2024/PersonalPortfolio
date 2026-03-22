"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  BookmarkPlus,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeInvoiceTotals, type InvoiceSaleType } from "@/lib/invoiceTotals";

interface Invoice {
  id: number;
  invoiceNumber: string;
  title: string;
  amount: number;
  subtotalCents?: number | null;
  taxRatePercent?: number | null;
  taxAmountCents?: number | null;
  invoiceSaleType?: InvoiceSaleType | null;
  status: string;
  dueDate: string | null;
  recipientEmail: string | null;
  hostInvoiceUrl: string | null;
  stripeInvoiceId?: string | null;
  lastReminderAt: string | null;
  createdAt: string;
  lineItems?: {
    description: string;
    amount: number;
    quantity?: number;
    saleType?: "service" | "product";
  }[];
}

type FormLine = {
  description: string;
  amount: string;
  quantity: string;
  saleType: "" | "service" | "product";
};

interface PresetRow {
  id: number;
  name: string;
  description: string;
  defaultAmountCents: number | null;
  defaultQuantity: number;
  saleType: string;
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
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    title: "",
    recipientEmail: "",
    dueDate: "",
    invoiceSaleType: "mixed" as InvoiceSaleType,
    taxRatePercent: "0",
    saveLineItemsToCatalog: false,
    lineItems: [] as FormLine[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    } else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const dialogOpen = createOpen || !!editing;

  const { data: invoiceConfig } = useQuery<{ defaultTaxPercent: number }>({
    queryKey: ["/api/admin/invoices/config"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/invoices/config");
      if (!res.ok) return { defaultTaxPercent: 0 };
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved,
  });

  const { data: presetsData } = useQuery<{ presets: PresetRow[] }>({
    queryKey: ["/api/admin/invoice-line-presets"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/invoice-line-presets");
      if (!res.ok) return { presets: [] };
      return res.json();
    },
    enabled: !!user?.isAdmin && !!user?.adminApproved && dialogOpen,
  });
  const presets = presetsData?.presets ?? [];

  const { data: crmContacts = [] } = useQuery<
    { id: number; email: string; name: string; company?: string | null }[]
  >({
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
    enabled: !!user?.isAdmin && !!user.adminApproved,
  });

  const previewTotals = useMemo(() => {
    const lines = form.lineItems
      .filter((l) => l.description.trim() && l.amount.trim())
      .map((l) => ({
        amount: Math.round(parseFloat(l.amount || "0") * 100),
        quantity: parseInt(l.quantity || "1", 10) || 1,
      }));
    const tax = Math.min(100, Math.max(0, parseFloat(form.taxRatePercent || "0") || 0));
    if (lines.length === 0) return { subtotalCents: 0, taxAmountCents: 0, totalCents: 0, tax };
    return { ...computeInvoiceTotals(lines, tax), tax };
  }, [form.lineItems, form.taxRatePercent]);

  const deletePresetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/invoice-line-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-line-presets"] });
      toast({ title: "Catalog item removed" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/admin/invoices", body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-line-presets"] });
      toast({ title: "Invoice created", description: "Draft invoice has been created." });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/admin/invoices/${id}`, body);
      return res.json() as Promise<{ status?: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-line-presets"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Invoice sent",
        description: "The recipient will receive an email with the payment link.",
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
      toast({ title: "Invoice deleted" });
      setDeleteId(null);
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  function resetForm() {
    const defTax = invoiceConfig?.defaultTaxPercent ?? 0;
    setForm({
      title: "",
      recipientEmail: "",
      dueDate: "",
      invoiceSaleType: "mixed",
      taxRatePercent: String(defTax),
      saveLineItemsToCatalog: false,
      lineItems: [{ description: "", amount: "", quantity: "1", saleType: "" }],
    });
  }

  function openCreate() {
    const defTax = invoiceConfig?.defaultTaxPercent ?? 0;
    setForm({
      title: "",
      recipientEmail: "",
      dueDate: "",
      invoiceSaleType: "mixed",
      taxRatePercent: String(defTax),
      saveLineItemsToCatalog: false,
      lineItems: [{ description: "", amount: "", quantity: "1", saleType: "" }],
    });
    setCreateOpen(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    const tax =
      inv.taxRatePercent != null ? String(inv.taxRatePercent) : String(invoiceConfig?.defaultTaxPercent ?? 0);
    setForm({
      title: inv.title,
      recipientEmail: inv.recipientEmail || "",
      dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : "",
      invoiceSaleType: (inv.invoiceSaleType as InvoiceSaleType) || "mixed",
      taxRatePercent: tax,
      saveLineItemsToCatalog: false,
      lineItems:
        (inv.lineItems?.length ?? 0) > 0
          ? inv.lineItems!.map((l) => ({
              description: l.description,
              amount: String(l.amount / 100),
              quantity: String(l.quantity ?? 1),
              saleType: (l.saleType as FormLine["saleType"]) || "",
            }))
          : [
              {
                description: inv.title,
                amount: String(inv.amount / 100),
                quantity: "1",
                saleType: "",
              },
            ],
    });
  }

  function buildLineItemsPayload() {
    return form.lineItems
      .filter((l) => l.description.trim() && l.amount.trim())
      .map((l) => ({
        description: l.description.trim(),
        amount: Math.round(parseFloat(l.amount || "0") * 100),
        quantity: parseInt(l.quantity || "1", 10) || 1,
        ...(l.saleType ? { saleType: l.saleType as "service" | "product" } : {}),
      }));
  }

  function submitCreate() {
    const lineItems = buildLineItemsPayload();
    if (lineItems.length === 0) {
      toast({ title: "Add at least one line", description: "Description and unit price are required.", variant: "destructive" });
      return;
    }
    const taxRate = parseFloat(form.taxRatePercent || "0") || 0;
    createMutation.mutate({
      title: form.title.trim(),
      recipientEmail: form.recipientEmail || undefined,
      dueDate: form.dueDate || undefined,
      lineItems,
      invoiceSaleType: form.invoiceSaleType,
      taxRatePercent: taxRate,
      saveLineItemsToCatalog: form.saveLineItemsToCatalog,
    });
  }

  function submitEdit() {
    if (!editing) return;
    if (editing.status === "paid") {
      updateMutation.mutate({
        id: editing.id,
        body: {
          title: form.title.trim(),
          recipientEmail: form.recipientEmail || null,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        },
      });
      return;
    }
    const lineItems = buildLineItemsPayload();
    if (lineItems.length === 0) {
      toast({ title: "Add at least one line", variant: "destructive" });
      return;
    }
    const taxRate = parseFloat(form.taxRatePercent || "0") || 0;
    updateMutation.mutate({
      id: editing.id,
      body: {
        title: form.title.trim(),
        recipientEmail: form.recipientEmail || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        lineItems,
        invoiceSaleType: form.invoiceSaleType,
        taxRatePercent: taxRate,
        saveLineItemsToCatalog: form.saveLineItemsToCatalog,
      },
    });
  }

  function applyPreset(presetId: string, rowIndex: number) {
    const p = presets.find((x) => String(x.id) === presetId);
    if (!p) return;
    setForm((f) => {
      const next = [...f.lineItems];
      next[rowIndex] = {
        description: p.description,
        amount: p.defaultAmountCents != null ? String(p.defaultAmountCents / 100) : "",
        quantity: String(p.defaultQuantity ?? 1),
        saleType: (p.saleType === "product" ? "product" : "service") as FormLine["saleType"],
      };
      return { ...f, lineItems: next };
    });
  }

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
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

  const editingPaid = editing?.status === "paid";

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
            Line items, sale labels, catalog presets, and tax — synced to Stripe totals
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
            {invoices.length} total · Edit any invoice; changing line items or tax on a sent invoice moves it back to
            draft and releases the Stripe invoice so you can send an updated one
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
              <p className="text-muted-foreground font-medium">No invoices yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first invoice to get started</p>
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
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Badge variant={statusVariant[inv.status] ?? "outline"}>{inv.status}</Badge>
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(inv.amount)}
                      </span>
                      {inv.taxAmountCents != null && inv.taxAmountCents > 0 && inv.subtotalCents != null && (
                        <span className="text-xs text-muted-foreground">
                          Subtotal {formatCurrency(inv.subtotalCents)} + tax {formatCurrency(inv.taxAmountCents)}
                          {inv.taxRatePercent != null ? ` (${inv.taxRatePercent}%)` : ""}
                        </span>
                      )}
                      {inv.dueDate && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due {format(new Date(inv.dueDate), "PPP")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(inv)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {inv.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700"
                        onClick={() => sendMutation.mutate(inv.id)}
                        disabled={sendMutation.isPending || !inv.recipientEmail}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    )}
                    {inv.status === "sent" && inv.hostInvoiceUrl && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={inv.hostInvoiceUrl} target="_blank" rel="noopener noreferrer">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(inv);
                        setDeleteId(inv.id);
                      }}
                      title="Delete invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit invoice" : "New invoice"}</DialogTitle>
            <DialogDescription>
              {editingPaid ? (
                <>
                  This invoice is <strong className="text-foreground">paid</strong>. You can update title, recipient,
                  and due date only. Amounts and line items stay fixed for accounting consistency.
                </>
              ) : (
                <>
                  Add line items (pre-tax). Sale type adds &quot;Service —&quot; or &quot;Product —&quot; on the Stripe invoice.
                  Tax is calculated from the subtotal. Editing amounts on a sent invoice moves it back to draft and voids
                  the previous Stripe invoice.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Invoice title</Label>
              <Input
                placeholder="e.g. Q1 implementation deposit"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sale type (default for lines)</Label>
              <Select
                value={form.invoiceSaleType}
                disabled={editingPaid}
                onValueChange={(v) => setForm((f) => ({ ...f, invoiceSaleType: v as InvoiceSaleType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed — use per-line or plain descriptions</SelectItem>
                  <SelectItem value="service">Service sale — prefix lines unless overridden</SelectItem>
                  <SelectItem value="product">Product sale — prefix lines unless overridden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={form.taxRatePercent}
                disabled={editingPaid}
                onChange={(e) => setForm((f) => ({ ...f, taxRatePercent: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Default from server <code className="text-[10px]">INVOICE_DEFAULT_TAX_PERCENT</code>. Subtotal × rate = tax;
                total includes tax.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(previewTotals.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({previewTotals.tax}%)</span>
                <span>{formatCurrency(previewTotals.taxAmountCents)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Total due</span>
                <span>{formatCurrency(previewTotals.totalCents)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Line items</Label>
                {!editingPaid && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        lineItems: [...f.lineItems, { description: "", amount: "", quantity: "1", saleType: "" }],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add line
                  </Button>
                )}
              </div>
              {form.lineItems.map((line, idx) => (
                <div key={idx} className="rounded-lg border p-3 space-y-2 bg-card">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <Label className="text-xs">Description / product or service detail</Label>
                      <Input
                        placeholder="e.g. Discovery workshop (8 hrs)"
                        readOnly={editingPaid}
                        value={line.description}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => {
                            const next = [...f.lineItems];
                            next[idx] = { ...next[idx], description: v };
                            return { ...f, lineItems: next };
                          });
                        }}
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        readOnly={editingPaid}
                        value={line.quantity}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => {
                            const next = [...f.lineItems];
                            next[idx] = { ...next[idx], quantity: v };
                            return { ...f, lineItems: next };
                          });
                        }}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Unit $</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        readOnly={editingPaid}
                        value={line.amount}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => {
                            const next = [...f.lineItems];
                            next[idx] = { ...next[idx], amount: v };
                            return { ...f, lineItems: next };
                          });
                        }}
                      />
                    </div>
                    <div className="w-[130px] space-y-1">
                      <Label className="text-xs">Line type</Label>
                      <Select
                        value={line.saleType || "inherit"}
                        disabled={editingPaid}
                        onValueChange={(v) => {
                          setForm((f) => {
                            const next = [...f.lineItems];
                            next[idx] = { ...next[idx], saleType: v === "inherit" ? "" : (v as FormLine["saleType"]) };
                            return { ...f, lineItems: next };
                          });
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Inherit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Use invoice default</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!editingPaid && form.lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            lineItems: f.lineItems.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {!editingPaid && presets.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookmarkPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Select onValueChange={(v) => applyPreset(v, idx)}>
                        <SelectTrigger className="h-8 text-xs max-w-xs">
                          <SelectValue placeholder="Insert from catalog…" />
                        </SelectTrigger>
                        <SelectContent>
                          {presets.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!editingPaid && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveCat"
                  checked={form.saveLineItemsToCatalog}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, saveLineItemsToCatalog: c === true }))}
                />
                <label htmlFor="saveCat" className="text-sm leading-none cursor-pointer">
                  Save these lines to catalog for quick reuse on future invoices
                </label>
              </div>
            )}

            {!editingPaid && presets.length > 0 && (
              <div className="rounded-md border border-dashed p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Saved catalog</p>
                <ul className="space-y-1 max-h-28 overflow-y-auto text-sm">
                  {presets.map((p) => (
                    <li key={p.id} className="flex justify-between items-center gap-2">
                      <span className="truncate">{p.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive shrink-0"
                        onClick={() => deletePresetMutation.mutate(p.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Recipient email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="client@company.com"
                  value={form.recipientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
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
                disabled={updateMutation.isPending || !form.title.trim()}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingPaid ? "Save details" : "Save"}
              </Button>
            ) : (
              <Button onClick={submitCreate} disabled={createMutation.isPending || !form.title.trim()}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
            <DialogDescription>Sets recipient email and suggests title and first line from the contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {crmContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition"
                onClick={() => {
                  const org = c.company?.trim() || c.name;
                  setForm((f) => ({
                    ...f,
                    recipientEmail: c.email,
                    title: f.title.trim() ? f.title : `Services — ${org}`,
                    lineItems:
                      f.lineItems.length === 1 && !f.lineItems[0].description.trim()
                        ? [
                            {
                              ...f.lineItems[0],
                              description: `Professional services — ${org}`,
                            },
                          ]
                        : f.lineItems,
                  }));
                  setCrmPickOpen(false);
                }}
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.email}</div>
                {c.company && <div className="text-xs text-muted-foreground mt-0.5">{c.company}</div>}
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
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.status === "paid" ? (
                <>
                  This removes the invoice record from Ascendra. The payment in Stripe is unchanged — reconcile there
                  if needed.
                </>
              ) : deleteTarget?.stripeInvoiceId || deleteTarget?.hostInvoiceUrl ? (
                <>
                  We will void or remove the linked Stripe invoice when possible, then delete this record. This cannot
                  be undone.
                </>
              ) : (
                <>This permanently removes the invoice. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
