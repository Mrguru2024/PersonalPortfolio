"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Image as ImageIcon, Sparkles, Wand2, Zap, FileText, Tags, Search } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RichTextEditor } from "@/components/RichTextEditor";
import { SEOPanel } from "@/components/SEOPanel";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useAuth } from "@/hooks/use-auth";
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

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters").refine(
    (val) => {
      const textContent = val.replace(new RegExp('<[^>]*>', 'g'), '').trim();
      return textContent.length >= 50;
    },
    { message: "Content must have at least 50 characters of actual text" }
  ),
  coverImage: z.string().url("Cover image must be a valid URL").optional().or(z.literal("")),
  tags: z.union([z.string(), z.array(z.string())]).transform(val => {
    if (Array.isArray(val)) return val;
    return val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }),
  isPublished: z.boolean().default(false),
  // SEO fields
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  internalLinks: z.array(z.object({
    text: z.string(),
    url: z.string(),
    postId: z.number().optional()
  })).optional().default([]),
  externalLinks: z.array(z.object({
    text: z.string(),
    url: z.string(),
    nofollow: z.boolean().optional().default(false)
  })).optional().default([]),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  twitterCard: z.string().optional().default("summary_large_image"),
  relatedPosts: z.array(z.number()).optional().default([]),
});

type FormValues = z.infer<typeof formSchema>;

const AdminBlog = () => {
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiStyle, setAiStyle] = useState<"professional" | "casual" | "technical" | "storytelling">("professional");
  const [aiLength, setAiLength] = useState<"short" | "medium" | "long">("medium");
  const [aiContentPrompt, setAiContentPrompt] = useState("");
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const { user } = useAuth();
  
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      content: "",
      coverImage: "",
      tags: [] as string[],
      isPublished: false,
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      canonicalUrl: "",
      internalLinks: [],
      externalLinks: [],
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterCard: "summary_large_image",
      relatedPosts: [],
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('/api/blog', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Blog post created successfully.",
      });
      router.push("/blog");
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      toast({
        title: "Error",
        description: errorMessage.includes("403") || errorMessage.includes("Access denied")
          ? "You don't have permission to create blog posts. Only admins and approved writers can create posts."
          : `Failed to create blog post: ${errorMessage}`,
        variant: "destructive"
      });
    }
  });

  // Handle uploading the cover image
  const handleCoverImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingCover(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', file);
      
      // Upload the image to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      const imageUrl = data.url;
      
      // Set the imageUrl value in the form
      form.setValue('coverImage', imageUrl);
      setCoverImageUrl(imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Cover image uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to upload image: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setUploadingCover(false);
    }
  }, [form, toast]);
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  // Generate a slug from the title
  const generateSlug = useCallback(() => {
    const title = form.getValues('title');
    if (!title) return;
    
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    form.setValue('slug', slug);
  }, [form]);
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Create New Blog Post</h1>
          <p className="text-gray-600 dark:text-gray-400">Add a new post to your blog with SEO optimization and rich formatting</p>
          <Separator className="my-6" />
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO & Optimization</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post Details</CardTitle>
                  <CardDescription>Basic information about your blog post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="My Awesome Blog Post" 
                            {...field} 
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e);
                              // Auto-generate slug when title changes if slug is empty
                              if (!form.getValues('slug')) {
                                setTimeout(generateSlug, 500);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input placeholder="my-awesome-blog-post" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={generateSlug}
                            className="shrink-0"
                          >
                            Generate
                          </Button>
                        </div>
                        <FormDescription>
                          The URL-friendly version of the title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1">
                          <FormLabel>Tags</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const title = form.getValues('title');
                              const content = form.getValues('content');
                              if (!title.trim()) {
                                toast({
                                  title: "Title required",
                                  description: "Please enter a title first",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setIsGenerating(true);
                              try {
                                const response = await apiRequest("POST", "/api/admin/blog/ai/generate-tags", {
                                  title,
                                  content: content.substring(0, 1500),
                                });
                                const data = await response.json();
                                const tags = data.tags || [];
                                field.onChange(tags);
                                toast({
                                  title: "Tags generated",
                                  description: `${tags.length} tags have been generated`,
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Generation failed",
                                  description: error.message || "Failed to generate tags",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsGenerating(false);
                              }
                            }}
                            disabled={isGenerating || !form.getValues('title')?.trim()}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Tags className="h-4 w-4 mr-2" />
                                AI Generate
                              </>
                            )}
                          </Button>
                        </div>
                        <FormControl>
                          <Input placeholder="react, javascript, webdev" {...field} value={Array.isArray(field.value) ? field.value.join(', ') : (field.value || "")} />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of tags.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Publish immediately</FormLabel>
                          <FormDescription>
                            If unchecked, the post will be saved as a draft.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>Add a cover image for your blog post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yoursite.com/cover-image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional: If left empty, an AI-generated image will be automatically created based on your blog post content.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid place-items-center border rounded-md p-4">
                    {(coverImageUrl || form.watch("coverImage")) ? (
                      <div className="space-y-2 w-full">
                        <img 
                          src={coverImageUrl || form.watch("coverImage")} 
                          alt="Cover preview" 
                          className="max-h-[200px] mx-auto object-contain rounded-md" 
                        />
                        <p className="text-sm text-center text-gray-500 truncate">{coverImageUrl || form.watch("coverImage")}</p>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No cover image selected</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-md px-4 py-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleCoverImageUpload}
                        disabled={uploadingCover || generatingImage}
                      />
                    </label>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const title = form.getValues('title');
                        const content = form.getValues('content');
                        if (!title.trim()) {
                          toast({
                            title: "Title required",
                            description: "Please enter a title first to generate an image",
                            variant: "destructive",
                          });
                          return;
                        }
                        setGeneratingImage(true);
                        try {
                          // First, generate an image prompt
                          const promptResponse = await apiRequest("POST", "/api/admin/blog/ai/generate-image-prompt", {
                            title,
                            content: (content || "").substring(0, 1000),
                          });
                          const promptData = await promptResponse.json();
                          const rawPrompt = typeof promptData?.prompt === "string" ? promptData.prompt.trim() : "";
                          if (!rawPrompt || rawPrompt.length < 10) {
                            toast({
                              title: "Invalid prompt",
                              description: "Could not generate an image prompt. Try again or enter a longer title/content.",
                              variant: "destructive",
                            });
                            return;
                          }
                          const prompt = rawPrompt.length > 1000 ? rawPrompt.substring(0, 1000) : rawPrompt;

                          // Then generate the image
                          const imageResponse = await apiRequest("POST", "/api/images/generate", {
                            prompt,
                            size: "1792x1024",
                            quality: "hd",
                          });
                          const imageData = await imageResponse.json();
                          if (!imageResponse.ok) {
                            const errMsg = imageData?.message || imageData?.error || "Failed to generate image";
                            throw new Error(typeof errMsg === "string" ? errMsg : "Failed to generate image");
                          }
                          if (imageData.success && imageData.data?.url) {
                            form.setValue('coverImage', imageData.data.url);
                            setCoverImageUrl(imageData.data.url);
                            toast({
                              title: "Image generated",
                              description: "AI-generated cover image has been added",
                            });
                          } else {
                            throw new Error(imageData.message || "Failed to generate image");
                          }
                        } catch (error: any) {
                          toast({
                            title: "Generation failed",
                            description: error.message || "Failed to generate cover image",
                            variant: "destructive",
                          });
                        } finally {
                          setGeneratingImage(false);
                        }
                      }}
                      disabled={generatingImage || uploadingCover || !form.getValues('title')?.trim()}
                    >
                      {generatingImage ? (
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
                    
                    {(uploadingCover || generatingImage) && (
                      <div className="ml-2 flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-1" />
                        <span className="text-sm">{uploadingCover ? "Uploading..." : "Generating..."}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content</CardTitle>
                    <CardDescription>Write your blog post content</CardDescription>
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
                            Generate blog post content using AI
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Topic *</label>
                            <Input
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              placeholder="e.g., Building modern web applications with React"
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Style</label>
                              <Select value={aiStyle} onValueChange={(value: any) => setAiStyle(value)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                  <SelectItem value="technical">Technical</SelectItem>
                                  <SelectItem value="storytelling">Storytelling</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Length</label>
                              <Select value={aiLength} onValueChange={(value: any) => setAiLength(value)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="short">Short (800-1200 words)</SelectItem>
                                  <SelectItem value="medium">Medium (1500-2000 words)</SelectItem>
                                  <SelectItem value="long">Long (2500-3500 words)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Custom instructions (optional)</label>
                            <Textarea
                              value={aiContentPrompt}
                              onChange={(e) => setAiContentPrompt(e.target.value)}
                              placeholder="e.g., Include code examples, target beginners, add a CTA"
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
                                  const response = await apiRequest("POST", "/api/admin/blog/ai/generate-content", {
                                    topic: aiTopic,
                                    length: aiLength,
                                    style: aiStyle,
                                    customInstructions: aiContentPrompt.trim() || undefined,
                                  });
                                  const data = await response.json();
                                  const html = typeof data?.content === "string" ? data.content : "";
                                  form.setValue("content", html);
                                  toast({
                                    title: "Content generated",
                                    description: "AI content has been added to the editor",
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
                    {form.watch('content') && (
                      <Select
                        onValueChange={async (value) => {
                          const content = form.getValues('content');
                          if (!content.trim()) return;
                          setIsGenerating(true);
                          try {
                            const response = await apiRequest("POST", "/api/admin/blog/ai/improve-content", {
                              content,
                              instruction: value,
                            });
                            const data = await response.json();
                            form.setValue('content', data.content || "");
                            toast({
                              title: "Content improved",
                              description: `Content has been ${value === "make-more-engaging" ? "made more engaging" : value}d`,
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
                          <SelectItem value="add-seo">Add SEO</SelectItem>
                          <SelectItem value="summarize">Summarize</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>
                <CardContent>
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel>Summary</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const title = form.getValues('title');
                            const content = form.getValues('content');
                            if (!title.trim()) {
                              toast({
                                title: "Title required",
                                description: "Please enter a title first",
                                variant: "destructive",
                              });
                              return;
                            }
                            setIsGenerating(true);
                            try {
                              const response = await apiRequest("POST", "/api/admin/blog/ai/generate-summary", {
                                title,
                                content: content.substring(0, 1000),
                              });
                              const data = await response.json();
                              field.onChange(data.summary || "");
                              toast({
                                title: "Summary generated",
                                description: "AI-generated summary has been added",
                              });
                            } catch (error: any) {
                              toast({
                                title: "Generation failed",
                                description: error.message || "Failed to generate summary",
                                variant: "destructive",
                              });
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                          disabled={isGenerating || !form.getValues('title')?.trim()}
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
                      <FormControl>
                        <Textarea 
                          placeholder="A brief summary of your blog post..."
                          className="min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be displayed in blog post previews.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Write your blog post content here... Use the toolbar above to format your text."
                          />
                        </FormControl>
                        <FormDescription>
                          Use the formatting toolbar to style your content. You can add headings, lists, links, images, and more.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
              </CardContent>
            </Card>
              </TabsContent>
              
              <TabsContent value="seo" className="space-y-8">
                <SEOPanel
                  title={form.watch("title")}
                  summary={form.watch("summary")}
                  content={form.watch("content")}
                  slug={form.watch("slug")}
                  coverImage={form.watch("coverImage") || ""}
                  tags={form.watch("tags") || []}
                  metaTitle={form.watch("metaTitle") || ""}
                  metaDescription={form.watch("metaDescription") || ""}
                  keywords={form.watch("keywords") || []}
                  canonicalUrl={form.watch("canonicalUrl") || ""}
                  internalLinks={form.watch("internalLinks") || []}
                  externalLinks={form.watch("externalLinks") || []}
                  ogTitle={form.watch("ogTitle") || ""}
                  ogDescription={form.watch("ogDescription") || ""}
                  ogImage={form.watch("ogImage") || ""}
                  twitterCard={form.watch("twitterCard") || "summary_large_image"}
                  relatedPosts={form.watch("relatedPosts") || []}
                  onMetaTitleChange={(value) => form.setValue("metaTitle", value)}
                  onMetaDescriptionChange={(value) => form.setValue("metaDescription", value)}
                  onKeywordsChange={(keywords) => form.setValue("keywords", keywords)}
                  onCanonicalUrlChange={(value) => form.setValue("canonicalUrl", value)}
                  onInternalLinksChange={(links) => form.setValue("internalLinks", links)}
                  onExternalLinksChange={(links) => form.setValue("externalLinks", links.map(link => ({ ...link, nofollow: link.nofollow ?? false })))}
                  onOgTitleChange={(value) => form.setValue("ogTitle", value)}
                  onOgDescriptionChange={(value) => form.setValue("ogDescription", value)}
                  onOgImageChange={(value) => form.setValue("ogImage", value)}
                  onTwitterCardChange={(value) => form.setValue("twitterCard", value)}
                  onRelatedPostsChange={(posts) => form.setValue("relatedPosts", posts)}
                />
              </TabsContent>
            </Tabs>
            
            <Card>
              <CardFooter className="flex justify-end space-x-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/blog")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="min-w-[100px]"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Post"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminBlog;