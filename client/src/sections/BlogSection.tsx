import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Clock, Tag } from "lucide-react";
import { formatDistance } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BlogPost } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";

const BlogSection = () => {
  const { data: blogPosts, isLoading, error } = useQuery({
    queryKey: ["/api/blog"],
    queryFn: async (): Promise<BlogPost[]> => {
      const response = await apiRequest("/api/blog");
      return response as BlogPost[];
    }
  });

  return (
    <section id="blog" className="py-20 bg-gray-50 dark:bg-gray-800/50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span>Latest from the Blog</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Thoughts, insights, and updates from my journey as a developer and entrepreneur.
          </p>
          <Separator className="my-6" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-gray-200 dark:border-gray-700 h-[400px] animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
                <CardHeader>
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 dark:text-red-400 text-lg mb-4">
              Unable to load blog posts at this time
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : !blogPosts || blogPosts.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-4">
              No blog posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check back soon for new content! I'm working on exciting articles to share with you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistance(new Date(post.publishedAt), new Date(), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {post.summary}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-3 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="link" className="h-auto p-0 font-normal text-primary hover:text-primary/80">
                      Read more →
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/blog">
            <Button variant="outline" className="rounded-full">
              View All Posts
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;