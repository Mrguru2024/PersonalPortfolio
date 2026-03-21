import { useEffect } from "react";
import type { BlogPost } from "@/lib/data";
import { applyDefaultClientSiteSeo } from "@shared/default-client-seo";
import {
  clearArticleTagMetas,
  removeJsonLdScript,
  setArticleTagMetas,
  updateJsonLdScript,
  updateLinkTag,
  updateMetaTag,
} from "@shared/seo-head";

interface BlogPostSEOProps {
  post: BlogPost;
  baseUrl?: string;
}

const BLOG_POST_JSON_LD_ID = "blog-post-seo";

export function BlogPostSEO({
  post,
  baseUrl = "https://mrguru.dev",
}: BlogPostSEOProps) {
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const imageUrl = post.coverImage || `${baseUrl}/images/mrguru-og-image.jpg`;

  const plainTextDescription =
    post.content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 160) + "...";

  const description = post.summary || plainTextDescription;

  const publishDate = new Date(post.publishedAt).toISOString();
  const modifiedDate = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishDate;

  const keywords = post.tags.join(", ");

  useEffect(() => {
    const pageTitle = `${post.title} | MrGuru.dev Blog`;
    document.title = pageTitle;

    updateMetaTag("description", description);
    updateMetaTag(
      "keywords",
      `${keywords}, MrGuru.dev, Anthony MrGuru Feaster, blog, web development`,
    );
    updateLinkTag("canonical", postUrl);

    updateMetaTag("og:type", "article", true);
    updateMetaTag("og:url", postUrl, true);
    updateMetaTag("og:title", post.title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", imageUrl, true);
    updateMetaTag("article:published_time", publishDate, true);
    updateMetaTag("article:modified_time", modifiedDate, true);
    setArticleTagMetas(post.tags);

    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:url", postUrl);
    updateMetaTag("twitter:title", post.title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", imageUrl);

    updateJsonLdScript(
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: description,
        image: imageUrl,
        url: postUrl,
        datePublished: publishDate,
        dateModified: modifiedDate,
        keywords: keywords,
        author: {
          "@type": "Person",
          name: "Anthony MrGuru Feaster",
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Ascendra Technologies",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/favicon-32x32.png`,
            width: 32,
            height: 32,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": postUrl,
        },
      },
      BLOG_POST_JSON_LD_ID,
    );

    return () => {
      removeJsonLdScript(BLOG_POST_JSON_LD_ID);
      clearArticleTagMetas();
      applyDefaultClientSiteSeo();
    };
  }, [
    post.title,
    post.slug,
    post.tags,
    description,
    keywords,
    imageUrl,
    postUrl,
    publishDate,
    modifiedDate,
    baseUrl,
  ]);

  return null;
}
