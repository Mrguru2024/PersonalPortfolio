'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlogPost } from '../shared/schema';
import { formatDate, calculateReadingTime } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract unique tags from all posts
  const allTags = posts
    ? [...new Set(posts.flatMap((post) => post.tags || []))]
    : [];

  // Filter posts based on search term and selected tag
  const filteredPosts = posts
    ? posts.filter((post) => {
        const matchesSearch =
          !searchTerm ||
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.summary.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTag = !selectedTag || post.tags?.includes(selectedTag);

        return matchesSearch && matchesTag;
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gradient">
            Blog & Insights
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thoughts, stories, and ideas about web development, programming, and
            technology.
          </p>

          <div className="flex flex-col md:flex-row gap-6 mb-10">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full p-3 rounded-lg border border-border bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm ${
                  !selectedTag
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                    : 'bg-secondary text-foreground'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedTag === tag
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary/60" />
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Link
                  href={`/blog/${post.slug}`}
                  key={post.id}
                  className="group"
                >
                  <article className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {post.featuredImage && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>•</span>
                        <span>{calculateReadingTime(post.content)} min read</span>
                      </div>
                      <h2 className="text-xl font-semibold mb-3 group-hover:text-gradient transition-all duration-200">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground mb-4 flex-1">
                        {post.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {post.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-secondary rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter to find what you're looking
                for.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}