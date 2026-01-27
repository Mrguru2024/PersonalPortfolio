"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

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
                        <FormLabel>Tags</FormLabel>
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
                          <Input placeholder="https://example.com/my-image.jpg" {...field} />
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
                  
                  <div className="flex justify-center">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-md px-4 py-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload cover image</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleCoverImageUpload}
                        disabled={uploadingCover}
                      />
                    </label>
                    
                    {uploadingCover && (
                      <div className="ml-2 flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-1" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>Write your blog post content</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
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