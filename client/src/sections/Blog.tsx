'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BlogPost } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import AnimatedButton from '@/components/AnimatedButton';

export default function Blog() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section id="blog" className="py-20 bg-gradient-to-b from-background to-background/95">
      <div className="container px-4 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Latest <span className="text-primary">Insights</span>
          </motion.h2>
          <motion.p 
            className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12"
            variants={itemVariants}
          >
            I share my knowledge and experience through articles on web development, design trends, and tech industry insights.
          </motion.p>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts?.slice(0, 3).map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={itemVariants}
                  className="group"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="h-full overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                      {post.coverImage && (
                        <div 
                          className="h-48 w-full bg-cover bg-center"
                          style={{ 
                            backgroundImage: `url(${post.coverImage})` 
                          }}
                        />
                      )}
                      
                      <CardHeader className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {post.tags?.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/20">
                              {post.tags[0]}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2 text-muted-foreground">
                          {post.summary || post.content.substring(0, 120) + '...'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="px-6 pb-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div 
                              className="h-8 w-8 rounded-full bg-cover bg-center mr-2 bg-gray-700"
                            />
                            <span className="text-sm">
                              MrGuru
                            </span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            5 min read
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-6">
                        <span className="text-primary text-sm font-medium group-hover:underline">
                          Read more
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          
          <motion.div 
            className="flex justify-center mt-12"
            variants={itemVariants}
          >
            <Link href="/blog">
              <AnimatedButton
                variant="outline"
                size="lg"
                className="border-primary/30 hover:border-primary/60"
                withHoverEffect
              >
                View All Articles
              </AnimatedButton>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}