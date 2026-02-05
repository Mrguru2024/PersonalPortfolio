"use client";

import Script from "next/script";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImage?: string;
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  authorId?: number;
  keywords?: string[];
  canonicalUrl?: string;
}

interface EnhancedStructuredDataProps {
  readonly post: BlogPost;
  readonly baseUrl?: string;
}

/**
 * Enhanced Structured Data component for better SEO
 * Adds multiple schema types: BlogPosting, Article, BreadcrumbList, and Organization
 */
export function EnhancedStructuredData({
  post,
  baseUrl = "https://mrguru.dev",
}: EnhancedStructuredDataProps) {
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const imageUrl = post.coverImage || `${baseUrl}/images/blog-default.jpg`;

  // Extract text content for word count
  const textContent = post.content?.replaceAll(/<[^>]*>/g, "").trim() || "";
  const wordCount = textContent.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // BlogPosting schema (primary)
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary || textContent.substring(0, 160),
    image: imageUrl,
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified:
      post.updatedAt || post.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: "Anthony Feaster",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Ascendra Technologies",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/ascendra-logo.svg`,
        width: 60,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    keywords: post.keywords?.join(", ") || post.tags?.join(", ") || "",
    articleSection: post.tags?.[0] || "Technology",
    wordCount: wordCount,
    timeRequired: `PT${readingTime}M`,
    inLanguage: "en-US",
  };

  // Article schema (for better Google News compatibility)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || textContent.substring(0, 160),
    image: imageUrl,
    datePublished: post.publishedAt || new Date().toISOString(),
    dateModified:
      post.updatedAt || post.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: "Anthony Feaster",
    },
    publisher: {
      "@type": "Organization",
      name: "Ascendra Technologies",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/ascendra-logo.svg`,
      },
    },
    mainEntityOfPage: postUrl,
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  // Organization schema (for site-wide SEO)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ascendra Technologies",
    url: baseUrl,
    logo: `${baseUrl}/ascendra-logo.svg`,
    sameAs: [
      // Add social media links if available
    ],
  };

  return (
    <>
      <Script
        id="blog-posting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}
