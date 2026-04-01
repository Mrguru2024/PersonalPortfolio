"use client";

import { use } from "react";
import BlogPost from "@/route-modules/BlogPost";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <BlogPost slug={slug} />;
}
