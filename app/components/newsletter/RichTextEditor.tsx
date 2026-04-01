"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Upload,
  Loader2,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Minus,
  Table2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

const HIGHLIGHT_PRESETS = [
  { label: "Yellow", color: "#fef08a" },
  { label: "Green", color: "#bbf7d0" },
  { label: "Blue", color: "#bfdbfe" },
  { label: "Pink", color: "#fbcfe8" },
  { label: "Clear", color: "" },
];

function buildExtensions(advanced: boolean, placeholder: string) {
  const kit = StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  });
  const image = Image.configure({ inline: true, allowBase64: true });
  const link = Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "text-primary underline" },
  });
  const ph = Placeholder.configure({ placeholder });

  if (!advanced) {
    return [kit, image, link, ph];
  }

  return [
    kit,
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: true }),
    Table.configure({
      resizable: false,
      HTMLAttributes: {
        class: "border-collapse border border-border w-full text-sm",
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    image,
    link,
    ph,
  ];
}

const editorShellClass =
  "prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none mx-auto focus:outline-none min-h-[420px] p-4 text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_blockquote]:text-muted-foreground [&_code]:text-foreground [&_pre]:text-foreground [&_a]:text-primary [&_a]:underline [&_table]:border-collapse [&_td]:border [&_th]:border [&_th]:bg-muted/80 [&_td]:p-2 [&_th]:p-2 [&_td]:align-top";

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  /** Layout/styling tools for email: alignment, color, highlight, tables. */
  advanced?: boolean;
  /** `emailHub` uploads to Email Hub assets (works for all approved admins). Default uses site `/api/upload`. */
  imageUploadTarget?: "site" | "emailHub";
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  advanced = false,
  imageUploadTarget = "site",
}: RichTextEditorProps) {
  const { toast } = useToast();
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [textColor, setTextColor] = useState("#1a1a1a");

  const extensions = useMemo(
    () => buildExtensions(advanced, placeholder),
    [advanced, placeholder],
  );

  const editor = useEditor(
    {
      extensions,
      content,
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
      editorProps: {
        attributes: {
          class: editorShellClass,
        },
      },
      immediatelyRender: false,
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content ?? "", { emitUpdate: false });
    }
  }, [editor, content]);

  const insertImageSrc = useCallback(
    (src: string) => {
      if (!editor) return;
      editor.chain().focus().setImage({ src }).run();
    },
    [editor],
  );

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setIsLinkDialogOpen(false);
    }
  };

  const addImage = () => {
    if (imageUrl && editor) {
      insertImageSrc(imageUrl.trim());
      setImageUrl("");
      setIsImageDialogOpen(false);
    }
  };

  const uploadImageFile = async (file: File) => {
    if (!editor) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (imageUploadTarget === "emailHub") {
        fd.append("name", file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120));
      }
      const endpoint =
        imageUploadTarget === "emailHub" ? "/api/admin/email-hub/assets/upload" : "/api/upload";
      const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "include" });
      const j = (await res.json()) as { url?: string; fileUrl?: string; error?: string };
      if (!res.ok) throw new Error(j.error || "Upload failed");
      let url = (imageUploadTarget === "emailHub" ? j.fileUrl : j.url) || "";
      if (url.startsWith("/")) {
        url = `${window.location.origin}${url}`;
      }
      insertImageSrc(url);
      setIsImageDialogOpen(false);
      toast({ title: "Image inserted" });
    } catch (e) {
      toast({
        title: "Image upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  if (!editor) {
    return (
      <div className="border rounded-lg flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
        Loading editor…
      </div>
    );
  }

  const imageAccept =
    imageUploadTarget === "emailHub"
      ? "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
      : "image/jpeg,image/png,image/gif,image/webp";

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "bg-muted" : ""}
          aria-label="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        {advanced ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "bg-muted" : ""}
            aria-label="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "bg-muted" : ""}
          aria-label="Code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
          aria-label="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
          aria-label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
          aria-label="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
          aria-label="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
          aria-label="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {advanced ? (
          <>
            <div className="w-px h-6 bg-border mx-0.5" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""}
              aria-label="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""}
              aria-label="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""}
              aria-label="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              className={editor.isActive({ textAlign: "justify" }) ? "bg-muted" : ""}
              aria-label="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Highlight">
                  <Highlighter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <p className="text-xs text-muted-foreground mb-2">Highlight</p>
                <div className="flex flex-wrap gap-1">
                  {HIGHLIGHT_PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      style={p.color ? { backgroundColor: p.color } : undefined}
                      onClick={() => {
                        if (!p.color) editor.chain().focus().unsetHighlight().run();
                        else editor.chain().focus().toggleHighlight({ color: p.color }).run();
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" aria-label="Text color">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto space-y-2" align="start">
                <Label className="text-xs">Text color</Label>
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-full cursor-pointer"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => editor.chain().focus().setColor(textColor).run()}
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              aria-label="Horizontal rule"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              aria-label="Insert table"
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              aria-label="Delete table"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : null}

        <div className="w-px h-6 bg-border mx-0.5" />

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={editor.isActive("link") ? "bg-muted" : ""}
              aria-label="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
              <DialogDescription>Enter the URL for the link</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addLink}>Add Link</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" aria-label="Image">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add image</DialogTitle>
              <DialogDescription>
                {imageUploadTarget === "emailHub"
                  ? "Upload to Email Hub assets (JPEG, PNG, GIF, WebP, SVG) or paste a public image URL."
                  : "Upload a file (JPEG, PNG, GIF, WebP) or paste a public image URL."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <input
                ref={imageFileRef}
                type="file"
                accept={imageAccept}
                className="sr-only"
                aria-hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadImageFile(f);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                disabled={imageUploading}
                onClick={() => imageFileRef.current?.click()}
              >
                {imageUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload from computer
              </Button>
              <div>
                <Label htmlFor="image-url">Image URL (optional)</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://yoursite.com/image.jpg"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addImage} disabled={!imageUrl.trim()}>
                  Add from URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="w-px h-6 bg-border mx-0.5" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} className="min-h-[420px] max-h-[min(70vh,720px)] overflow-y-auto" />
    </div>
  );
}
