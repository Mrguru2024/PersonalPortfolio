import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Tag, Search } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogPost } from "@/lib/data";
import { apiRequest } from "@/lib/queryClient";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: () => apiRequest("/api/blog")
  });
  
  // Extract all unique tags from posts
  const allTags = posts 
    ? Array.from(new Set(posts.flatMap(post => post.tags)))
    : [];
    
  // Filter posts based on search query and selected tag
  const filteredPosts = posts?.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTag = selectedTag === null || post.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Blog</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Thoughts, insights, and updates from my journey as a developer and entrepreneur.
          </p>
          <Separator className="my-6" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="w-full md:w-3/4">
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Blog Posts */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="mb-6">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <Skeleton className="h-full w-full min-h-[200px]" />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <Skeleton className="h-8 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-1/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-red-500 mb-4">Failed to load blog posts</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : !filteredPosts || filteredPosts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || selectedTag 
                    ? "No posts match your search criteria" 
                    : "No blog posts available yet"}
                </p>
                {(searchQuery || selectedTag) && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTag(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="mb-6 overflow-hidden transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 h-[200px] overflow-hidden">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <div className="md:w-2/3 p-6">
                        <CardHeader className="p-0 mb-2">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                          </div>
                          <CardTitle className="text-xl mb-1">
                            <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                              {post.title}
                            </Link>
                          </CardTitle>
                          <CardDescription>
                            {post.tags.slice(0, 3).map((tag, i) => (
                              <Badge 
                                key={i} 
                                variant={tag === selectedTag ? "default" : "outline"} 
                                className="mr-2 cursor-pointer transition-colors"
                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 mt-4">
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                            {post.summary}
                          </p>
                          <Link href={`/blog/${post.slug}`}>
                            <Button variant="link" className="px-0 h-auto text-primary hover:text-primary/80">
                              Read more →
                            </Button>
                          </Link>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </>
                  ) : (
                    <>
                      <Badge 
                        variant={selectedTag === null ? "default" : "outline"} 
                        className="cursor-pointer mb-2"
                        onClick={() => setSelectedTag(null)}
                      >
                        All
                      </Badge>
                      {allTags.map((tag, i) => (
                        <Badge 
                          key={i} 
                          variant={tag === selectedTag ? "default" : "outline"} 
                          className="cursor-pointer mb-2"
                          onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  I write about my experiences as a developer, entrepreneur, and lifelong learner. 
                  My goal is to share knowledge and inspire others on their tech journey.
                </p>
                <Link href="/#contact">
                  <Button variant="outline" className="mt-4 w-full">
                    Get in Touch
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;