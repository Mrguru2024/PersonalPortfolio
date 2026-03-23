import type { MetadataRoute } from "next";
import { ensureAbsoluteUrl, getSiteBaseUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = ensureAbsoluteUrl(getSiteBaseUrl());
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth",
          "/login",
          "/portal",
          "/dashboard",
          "/gos/",
          "/proposal/",
          "/book/manage/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  };
}
