import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, Upload, Image as ImageIcon, Film } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim())),
  isPublished: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

const AdminBlog = () => {
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      content: "",
      coverImage: "",
      tags: "",
      isPublished: false
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
      navigate("/blog");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create blog post: ${error.toString()}`,
        variant: "destructive"
      });
    }
  });

  // Handle uploading the cover image
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };
  
  // Handle uploading media (images/videos) for the blog content
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingMedia(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('media', file);
      
      // Upload the media to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload media');
      
      const data = await response.json();
      const mediaUrl = data.url;
      
      // Add the media URL to the array
      setMediaUrls([...mediaUrls, mediaUrl]);
      
      // Update the content with the media URL
      const isVideo = file.type.startsWith('video/');
      const contentField = form.getValues('content');
      const mediaMarkdown = isVideo 
        ? `\n\n<video controls src="${mediaUrl}" style="max-width: 100%;"></video>\n\n`
        : `\n\n![${file.name}](${mediaUrl})\n\n`;
      
      form.setValue('content', contentField + mediaMarkdown);
      
      toast({
        title: "Media uploaded",
        description: `${isVideo ? 'Video' : 'Image'} uploaded and added to content`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to upload media: ${error?.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setUploadingMedia(false);
    }
  };
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  // Generate a slug from the title
  const generateSlug = () => {
    const title = form.getValues('title');
    if (!title) return;
    
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    form.setValue('slug', slug);
  };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Create New Blog Post</h1>
          <p className="text-gray-600 dark:text-gray-400">Add a new post to your blog with images and videos</p>
          <Separator className="my-6" />
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                          <Input placeholder="react, javascript, webdev" {...field} />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid place-items-center border rounded-md p-4">
                    {coverImageUrl ? (
                      <div className="space-y-2 w-full">
                        <img 
                          src={coverImageUrl} 
                          alt="Cover preview" 
                          className="max-h-[200px] mx-auto object-contain rounded-md" 
                        />
                        <p className="text-sm text-center text-gray-500 truncate">{coverImageUrl}</p>
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
                          <Textarea 
                            placeholder="Write your blog post content here..."
                            className="min-h-[300px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          You can use plain text or markdown formatting.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-6 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-md p-3 text-center">
                          <ImageIcon className="h-5 w-5" />
                          <span>Add Image</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleMediaUpload}
                          disabled={uploadingMedia}
                        />
                      </label>
                    </div>
                    
                    <div>
                      <label className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-md p-3 text-center">
                          <Film className="h-5 w-5" />
                          <span>Add Video</span>
                        </div>
                        <input 
                          type="file" 
                          accept="video/*"
                          className="hidden" 
                          onChange={handleMediaUpload}
                          disabled={uploadingMedia}
                        />
                      </label>
                    </div>
                  </div>
                  
                  {uploadingMedia && (
                    <div className="flex items-center justify-center mt-2">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      <span className="text-sm">Uploading media...</span>
                    </div>
                  )}
                  
                  {mediaUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Media</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {mediaUrls.map((url, index) => (
                          <div key={index} className="border rounded-md p-2 text-xs truncate">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                              {url.substring(url.lastIndexOf('/') + 1)}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/blog")}
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