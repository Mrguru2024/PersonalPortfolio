"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Link2, Upload, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Mode = "url" | "upload" | "generate";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  /** Optional: show compact single row (e.g. in deliverable list) */
  compact?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  label = "Image",
  placeholder = "Paste image URL or upload or generate",
  className,
  compact = false,
}: ImagePickerProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [urlInput, setUrlInput] = useState(value);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setUrlInput((prev) => (value && value !== prev ? value : prev));
  }, [value]);

  const applyUrl = () => {
    const u = urlInput.trim();
    if (u) onChange(u);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image (JPEG, PNG, GIF, WebP).", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      toast({ title: "Image uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleGenerate = async () => {
    const prompt = generatePrompt.trim();
    if (prompt.length < 10) {
      toast({ title: "Prompt too short", description: "Enter at least 10 characters.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/images/generate", {
        prompt,
        size: "1024x1024",
        quality: "standard",
      });
      const data = await res.json();
      if (!data.success || !data.data?.url) throw new Error(data.message || "Generate failed");
      const imageUrl = data.data.url as string;
      // Persist to our uploads so the URL doesn't expire
      const saveRes = await apiRequest("POST", "/api/admin/images/save-from-url", { url: imageUrl });
      const saveData = await saveRes.json();
      if (saveRes.ok && saveData.url) {
        onChange(saveData.url);
        toast({ title: "Image generated and saved" });
      } else {
        onChange(imageUrl);
        toast({ title: "Image generated", description: "Using temporary URL (may expire)." });
      }
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Check OPENAI_API_KEY for AI images.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const showPreview = value && (value.startsWith("http") || value.startsWith("/"));

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && <Label className="text-xs">{label}</Label>}
        <div className="flex gap-2 flex-wrap items-start">
          {showPreview && (
            <div className="relative h-14 w-14 rounded border overflow-hidden bg-muted shrink-0">
              <Image src={value} alt="" fill className="object-cover" sizes="56px" unoptimized={value.startsWith("http")} />
              <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => onChange("")} aria-label="Clear"><X className="h-3 w-3" /></Button>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
              <TabsList className="h-9">
                <TabsTrigger value="url" className="text-xs"><Link2 className="h-3 w-3 mr-1" />URL</TabsTrigger>
                <TabsTrigger value="upload" className="text-xs"><Upload className="h-3 w-3 mr-1" />Upload</TabsTrigger>
                <TabsTrigger value="generate" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />AI</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-2">
                <div className="flex gap-2">
                  <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." className="h-9" />
                  <Button type="button" size="sm" variant="secondary" onClick={applyUrl}>Use</Button>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="mt-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} aria-label="Upload image file" />
                <Button type="button" size="sm" variant="secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  {uploading ? "Uploading…" : "Choose file"}
                </Button>
              </TabsContent>
              <TabsContent value="generate" className="mt-2">
                <div className="flex gap-2">
                  <Input value={generatePrompt} onChange={(e) => setGeneratePrompt(e.target.value)} placeholder="Describe the image…" className="h-9" />
                  <Button type="button" size="sm" variant="secondary" disabled={generating || generatePrompt.trim().length < 10} onClick={handleGenerate}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label>{label}</Label>}
      {showPreview && (
        <div className="relative w-full max-w-xs aspect-video rounded-lg border overflow-hidden bg-muted">
          <Image src={value} alt="" fill className="object-contain" sizes="320px" unoptimized={value.startsWith("http")} />
          <Button type="button" variant="secondary" size="sm" className="absolute top-2 right-2" onClick={() => onChange("")}>Clear</Button>
        </div>
      )}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url" className="gap-1.5"><Link2 className="h-4 w-4" />By URL</TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-4 w-4" />Upload</TabsTrigger>
          <TabsTrigger value="generate" className="gap-1.5"><Sparkles className="h-4 w-4" />Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-3 space-y-2">
          <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" />
          <Button type="button" size="sm" onClick={applyUrl}>Use this URL</Button>
        </TabsContent>
        <TabsContent value="upload" className="mt-3 space-y-2">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFileChange} aria-label="Choose image to upload" />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Uploading…" : "Choose image (JPEG, PNG, GIF, WebP, max 10MB)"}
          </Button>
        </TabsContent>
        <TabsContent value="generate" className="mt-3 space-y-2">
          <Textarea value={generatePrompt} onChange={(e) => setGeneratePrompt(e.target.value)} placeholder="Describe the image you want (e.g. Professional hero image for a startup growth audit offer, soft gradient, modern)" rows={3} />
          <Button type="button" variant="outline" disabled={generating || generatePrompt.trim().length < 10} onClick={handleGenerate}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {generating ? "Generating…" : "Generate with AI"}
          </Button>
          <p className="text-xs text-muted-foreground">Uses DALL·E 3. Prompt must be at least 10 characters.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
