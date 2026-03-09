"use client";

import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BlogPost } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import AnimatedButton from "@/components/AnimatedButton";
import { fetchBlogSeedPosts } from "@/lib/blogSeedClient";
import { PRIMARY_CTA, SECONDARY_CTA, AUDIT_PATH, BOOK_CALL_HREF } from "@/lib/funnelCtas";
import { Button } from "@/components/ui/button";

export default function Blog() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8_000);
        const res = await fetch("/api/blog", {
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return fetchBlogSeedPosts();
        const json = await res.json();
        return Array.isArray(json) ? json : fetchBlogSeedPosts();
      } catch {
        return fetchBlogSeedPosts();
      }
    },
    staleTime: 60_000,
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
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <section
      id="blog"
      className="w-full min-w-0 max-w-full overflow-x-hidden py-10 fold:py-12 xs:py-16 sm:py-20 bg-gradient-to-b from-background to-background/95"
    >
      <div className="container px-3 fold:px-4 sm:px-6 mx-auto min-w-0 max-w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2
            className="text-2xl fold:text-3xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent px-1"
            variants={itemVariants}
          >
            Latest <span className="text-primary">Insights</span>
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-8 sm:mb-12 px-1"
            variants={itemVariants}
          >
            I share my knowledge and experience through articles on web
            development, design trends, and tech industry insights.
          </motion.p>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                            backgroundImage: `url(${post.coverImage})`,
                          }}
                        />
                      )}

                      <CardHeader className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
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
                          {post.summary ||
                            post.content.substring(0, 120) + "..."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="px-6 pb-0">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-cover bg-center mr-2 bg-gray-700" />
                            <span className="text-sm">Ascendra</span>
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
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
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
            <div className="flex flex-col xs:flex-row gap-2">
              <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0">
                <Link href={AUDIT_PATH}>{PRIMARY_CTA}</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-border">
                <Link href={BOOK_CALL_HREF}>{SECONDARY_CTA}</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
