"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, ArrowLeft, Upload, ClipboardPaste, FileSpreadsheet, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ImportResult = {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  createdIds?: number[];
};

export default function CrmImportPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [source, setSource] = useState("import");
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
    else if (!authLoading && user && (!user.isAdmin || !user.adminApproved)) router.push("/");
  }, [user, authLoading, router]);

  const importMutation = useMutation({
    mutationFn: async (payload: { pasted?: string; file?: File; source: string }) => {
      if (payload.file) {
        const form = new FormData();
        form.append("file", payload.file);
        form.append("source", payload.source);
        const res = await fetch("/api/admin/crm/contacts/import", {
          method: "POST",
          body: form,
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Import failed");
        }
        return res.json() as Promise<ImportResult>;
      }
      const res = await apiRequest("POST", "/api/admin/crm/contacts/import", {
        pasted: payload.pasted,
        source: payload.source,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Import failed");
      }
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setPasted("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (data.created > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/contacts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
        toast({ title: `${data.created} lead(s) added` });
      }
      if (data.errors.length > 0) toast({ title: `${data.skipped} skipped`, variant: "default" });
    },
    onError: (e: Error) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importMutation.mutate({ file, source });
  };

  const handlePasteSubmit = () => {
    const text = pasted.trim();
    if (!text) {
      toast({ title: "Paste some data first", variant: "destructive" });
      return;
    }
    importMutation.mutate({ pasted: text, source });
  };

  // Contact Picker API: pull contacts from device with user permission (Android Chrome, some mobile browsers)
  const contactPickerSupported =
    typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;
  const [contactPickerLoading, setContactPickerLoading] = useState(false);

  const handleDeviceContacts = async () => {
    if (!contactPickerSupported) {
      toast({
        title: "Not supported",
        description: "Use Chrome on Android or a browser that supports the Contact Picker.",
        variant: "destructive",
      });
      return;
    }
    setContactPickerLoading(true);
    try {
      const contacts = await (navigator as Navigator & { contacts: { select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; email?: string[]; tel?: string[] }[]> } }).contacts.select(
        ["name", "email", "tel"],
        { multiple: true }
      );
      if (!contacts.length) {
        toast({ title: "No contacts selected", variant: "default" });
        setContactPickerLoading(false);
        return;
      }
      const escapeCsv = (s: string) => (s.includes(",") || s.includes('"') ? `"${String(s).replace(/"/g, '""')}"` : s);
      const rows = contacts.map((c) => {
        const name = c.name?.[0]?.trim() ?? "";
        const email = c.email?.[0]?.trim() ?? "";
        const tel = c.tel?.[0]?.trim() ?? "";
        return [escapeCsv(name), escapeCsv(email), escapeCsv(tel)].join(",");
      });
      const csvText = "Name,Email,Phone\n" + rows.join("\n");
      importMutation.mutate({ pasted: csvText, source: "device" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("cancel") || msg.includes("abort") || msg.includes("User")) {
        toast({ title: "Selection cancelled", variant: "default" });
      } else {
        toast({ title: "Could not read contacts", description: msg, variant: "destructive" });
      }
    } finally {
      setContactPickerLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user?.isAdmin || !user?.adminApproved) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/crm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CRM
        </Link>
      </Button>
      <h1 className="text-2xl font-bold mt-4">Import leads</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Add potential leads from a spreadsheet or list. Works on mobile and desktop.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Paste from spreadsheet
            </CardTitle>
            <CardDescription>
              Copy rows from Excel, Google Sheets, or any list. Include a header row with <strong>Name</strong> and <strong>Email</strong> (required). Optional: Phone, Company, Job title, Industry, Notes, Source.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="sr-only">Paste data</Label>
              <Textarea
                placeholder="Name, Email, Phone, Company&#10;Jane Doe, jane@example.com, +1 555 123 4567, Acme Inc&#10;John Smith, john@example.com, , Beta Co"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={6}
                className="font-mono text-sm resize-y min-h-[120px]"
                aria-label="Paste CSV or tab-separated data"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Default source for imported leads</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. import, event, referral"
                className="mt-1 max-w-xs"
              />
            </div>
            <Button
              onClick={handlePasteSubmit}
              disabled={!pasted.trim() || importMutation.isPending}
              className="min-h-11 w-full sm:w-auto"
            >
              {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardPaste className="h-4 w-4 mr-2" />}
              Import pasted data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Upload CSV file
            </CardTitle>
            <CardDescription>
              Upload a .csv file. First row can be headers (Name, Email, …). Same column names as above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Default source for imported leads</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. import"
                className="mt-1 max-w-xs"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain,application/csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Choose CSV file"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="min-h-11 w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose file
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              From phone contacts
            </CardTitle>
            <CardDescription>
              {contactPickerSupported
                ? "Add leads from your device contacts. You choose which contacts to share; only selected names, emails, and numbers are sent."
                : "Pull contacts from your phone with your permission. Supported in Chrome on Android and some other mobile browsers. On unsupported devices, use paste or file upload above."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Source label for imported leads</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. device"
                className="mt-1 max-w-xs"
              />
            </div>
            {contactPickerSupported ? (
              <Button
                variant="outline"
                onClick={handleDeviceContacts}
                disabled={importMutation.isPending || contactPickerLoading}
                className="min-h-11 w-full sm:w-auto"
              >
                {contactPickerLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                Choose from device
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not available in this browser. Try Chrome on Android, or use paste/file upload.
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {result.created > 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                <strong>{result.created}</strong> lead(s) added.
                {result.skipped > 0 && <span className="text-muted-foreground"> {result.skipped} skipped.</span>}
              </p>
              {result.errors.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 15).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.message}</li>
                  ))}
                  {result.errors.length > 15 && <li>… and {result.errors.length - 15} more</li>}
                </ul>
              )}
              <Button variant="link" className="px-0" asChild>
                <Link href="/admin/crm">View contacts</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
