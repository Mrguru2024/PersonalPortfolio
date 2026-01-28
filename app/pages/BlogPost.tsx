"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Clock, Tag, User, ArrowLeft, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BlogPost, BlogComment } from "@/lib/data";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { BlogPostSEO } from "@/components/SEO";
import { BlogPostAnalytics } from "@/components/blog/BlogPostAnalytics";
import { ClickTracker } from "@/components/blog/ClickTracker";
import { AudioReader } from "@/components/blog/AudioReader";
import { BlogPostFormatter } from "@/components/blog/BlogPostFormatter";
import { ShareArticle } from "@/components/blog/ShareArticle";
import { EnhancedStructuredData } from "@/components/blog/EnhancedStructuredData";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { LinkDisplay } from "@/components/blog/LinkDisplay";

// Comment form with CAPTCHA
interface CommentFormProps {
  postId: number;
}

const commentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  content: z.string().min(10, "Comment must be at least 10 characters"),
  captchaToken: z.string().min(1, "Please complete the CAPTCHA verification")
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

const CommentForm = ({ postId }: CommentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaValue, setCaptchaValue] = useState("");
  
  // Set up form
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      content: "",
      captchaToken: ""
    }
  });
  
  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const res = await apiRequest("POST", `/api/blog/post/${postId}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      // Reset form
      form.reset();
      setCaptchaValue("");
      
      // Show success message
      toast({
        title: "Comment submitted",
        description: "Your comment has been submitted and is awaiting moderation.",
        variant: "default"
      });
      
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: [`/api/blog/post/${postId}/comments`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error submitting comment",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  function onSubmit(data: CommentFormValues) {
    // Add captcha token to data
    data.captchaToken = captchaValue;
    
    // Submit comment
    commentMutation.mutate(data);
  }
  
  // Simple CAPTCHA simulation - in real app, this would use a service like reCAPTCHA
  function handleCaptchaChange(value: string) {
    setCaptchaValue(value);
    form.setValue("captchaToken", value);
  }
  
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share your thoughts..." 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Simple CAPTCHA simulation */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
            <FormField
              control={form.control}
              name="captchaToken"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Verification</FormLabel>
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      To prevent spam, please type "not-a-robot" in the field below:
                    </p>
                    <Input 
                      placeholder="Type verification text" 
                      onChange={(e) => handleCaptchaChange(e.target.value)}
                      value={captchaValue}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full sm:w-auto"
            disabled={commentMutation.isPending}
          >
            {commentMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : "Submit Comment"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

const BlogPostPage = () => {
  const params = useParams();
  const slug = (params?.slug as string) || "";
  
  const { data: post, isLoading: isPostLoading, error: postError } = useQuery({
    queryKey: [`/api/blog/${slug}`],
    queryFn: async () => {
      try {
        const response = await apiRequest<BlogPost>("GET", `/api/blog/${slug}`);
        if (!response.ok) {
          // For 404, return null to trigger "not found" UI
          if (response.status === 404) {
            return null;
          }
          throw new Error(`Failed to fetch blog post: ${response.status}`);
        }
        return response.json();
      } catch (error: any) {
        // Don't log 404 errors - they're expected for missing posts
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          return null;
        }
        console.error("Error fetching blog post:", error);
        throw error;
      }
    },
    retry: false, // Don't retry 404s
    retryDelay: 1000,
  });
  
  const { data: comments, isLoading: areCommentsLoading } = useQuery({
    queryKey: [`/api/blog/post/${post?.id}/comments`],
    queryFn: async () => {
      if (!post?.id) return [];
      try {
        const response = await apiRequest<BlogComment[]>("GET", `/api/blog/post/${post.id}/comments`);
        if (!response.ok) {
          // Return empty array for 404s (no comments yet)
          if (response.status === 404) {
            return [];
          }
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }
        return response.json();
      } catch (error: any) {
        // Don't log 404 errors - they're expected when no comments exist
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          return [];
        }
        console.error("Error fetching comments:", error);
        return []; // Return empty array on error to prevent UI issues
      }
    },
    enabled: !!post?.id,
    retry: false
  });

  if (isPostLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Post Not Found</AlertTitle>
            <AlertDescription>
              The blog post you're looking for doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
          <Link href="/blog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <BlogPostAnalytics />
      <ClickTracker />
      <div className="container mx-auto px-4 py-12">
      {/* Add SEO component */}
      {post && (
        <>
          <BlogPostSEO post={post} />
          <EnhancedStructuredData post={post} />
        </>
      )}
      
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs for SEO */}
        <Breadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />
        
        <Link href="/blog">
          <Button variant="ghost" className="mb-6 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {post.publishedAt ? format(new Date(post.publishedAt), 'MMMM d, yyyy') : 'Publication date unavailable'}
          </div>
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            MrGuru.dev
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {post.content ? Math.ceil(post.content.split(' ').length / 200) : 1} min read
          </div>
        </div>
        
        {post.coverImage ? (
          <div className="mb-8 h-[300px] overflow-hidden rounded-lg">
            <img 
              src={post.coverImage} 
              alt={post.title || 'Blog post'} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-8 h-[300px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">
            <span className="text-gray-500 dark:text-gray-400">No cover image available</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags && post.tags.length > 0 ? 
            post.tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            )) : 
            <Badge variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              General
            </Badge>
          }
        </div>
        
        {/* Audio Reader */}
        <AudioReader content={post.content || ""} title={post.title} />
        
        {/* Share Article */}
        <ShareArticle
          title={post.title}
          url={`https://mrguru.dev/blog/${post.slug}`}
          summary={post.summary || ""}
        />
        
        {/* Blog Content with Auto-Formatting */}
        <BlogPostFormatter
          content={post.content || '<p>No content available for this post.</p>'}
          internalLinks={post.internalLinks || []}
          externalLinks={post.externalLinks || []}
        />
        
        {/* Display Links Section */}
        <LinkDisplay
          internalLinks={post.internalLinks || []}
          externalLinks={post.externalLinks || []}
        />
        
        <Separator className="my-12" />
        
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments {comments?.length ? `(${comments.length})` : ''}
          </h3>
          
          {areCommentsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: BlogComment) => (
                <Card key={comment.id}>
                  <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800 flex flex-row justify-between items-center">
                    <div>
                      <p className="font-medium">{comment.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {comment.createdAt ? format(new Date(comment.createdAt), 'MMMM d, yyyy') : 'Date unavailable'}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 px-4">
                    <p>{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="mt-8">
            <h4 className="text-lg font-semibold mb-4">Leave a Comment</h4>
            <CommentForm postId={post.id} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default BlogPostPage;