'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Clock, Calendar, MessageSquare, Share2, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BlogPost, BlogComment } from '../../../shared/schema';
import { formatDate, calculateReadingTime } from '../../lib/utils';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const { data: post, isLoading: isLoadingPost } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<BlogComment[]>({
    queryKey: [`/api/blog/${slug}/comments`],
    enabled: !!post, // Only fetch comments if post is loaded
  });

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    
    if (!comment.trim() || !name.trim() || !email.trim()) {
      setSubmitError('All fields are required');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    
    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          authorName: name,
          authorEmail: email,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit comment');
      }
      
      // Clear form
      setComment('');
      setName('');
      setEmail('');
      setSubmitSuccess('Comment submitted successfully! It will appear after moderation.');
    } catch (error) {
      console.error('Error submitting comment:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingPost) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary/60" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center py-20">
            <h1 className="text-3xl font-bold mb-4">Blog Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              Sorry, the blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link 
              href="/blog"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <div className="w-full relative bg-gradient-to-b from-primary/10 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link 
                href="/blog"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Blog
              </Link>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{calculateReadingTime(post.content)} min read</span>
                </div>
                {post.authorId && (
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>MrGuru</span>
                  </div>
                )}
              </div>
              
              <p className="text-xl text-muted-foreground">
                {post.summary}
              </p>
            </div>
          </div>
        </div>
        
        {/* Featured image */}
        {post.coverImage && (
          <div className="container mx-auto px-4 -mt-8">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img 
                  src={post.coverImage} 
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border">
                <h3 className="text-sm font-medium mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link 
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 bg-secondary rounded-full text-sm hover:bg-secondary/80 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Share */}
            <div className="mt-10 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-3">Share:</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Comments */}
            <div className="mt-16 pt-8 border-t border-border">
              <h3 className="text-2xl font-bold mb-6">
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Comments {comments.length > 0 && `(${comments.length})`}
                </div>
              </h3>
              
              {isLoadingComments ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div 
                      key={comment.id}
                      className="bg-card rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex justify-between mb-3">
                        <div className="font-medium">{comment.authorName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <p className="text-card-foreground whitespace-pre-line">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card/50 rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
              
              {/* Comment form */}
              <form onSubmit={handleSubmitComment} className="mt-8 bg-card rounded-lg p-6 shadow-sm">
                <h4 className="text-xl font-semibold mb-4">Leave a comment</h4>
                
                {submitSuccess && (
                  <div className="bg-green-500/10 text-green-500 p-4 rounded-lg mb-4">
                    {submitSuccess}
                  </div>
                )}
                
                {submitError && (
                  <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-4">
                    {submitError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium mb-1">Comment</label>
                    <textarea
                      id="comment"
                      rows={5}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button-gradient px-6 py-3 rounded-lg text-white font-medium disabled:opacity-70 flex items-center justify-center"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Comment
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Your comment will be visible after moderation.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}