import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Calendar, Clock, Tag, User, ArrowLeft, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogPost, BlogComment } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";

const BlogPostPage = () => {
  const { slug } = useParams();
  
  const { data: post, isLoading: isPostLoading, error: postError } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    queryFn: () => apiRequest(`/api/blog/${slug}`)
  });
  
  const { data: comments, isLoading: areCommentsLoading } = useQuery<BlogComment[]>({
    queryKey: [`/api/blog/post/${post?.id}/comments`],
    queryFn: () => apiRequest(`/api/blog/post/${post?.id}/comments`),
    enabled: !!post?.id
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
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
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
            {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
          </div>
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            MrGuru.dev
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {Math.ceil(post.content.split(' ').length / 200)} min read
          </div>
        </div>
        
        <div className="mb-8 h-[300px] overflow-hidden rounded-lg">
          <img 
            src={post.coverImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {post.content.split('\n').map((paragraph, i) => (
            paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
          ))}
        </div>
        
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
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="py-3 px-4 border-b border-gray-100 dark:border-gray-800 flex flex-row justify-between items-center">
                    <div>
                      <p className="font-medium">{comment.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(comment.createdAt), 'MMMM d, yyyy')}
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
          
          {/* Comment form would go here */}
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;