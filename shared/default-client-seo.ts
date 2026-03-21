import {
  clearArticleTagMetas,
  ensureUtf8Charset,
  updateLinkTag,
  updateMetaTag,
} from "./seo-head";

/** Baseline document head for the legacy Vite SPA (MrGuru.dev defaults). */
export function applyDefaultClientSiteSeo(): void {
  if (typeof document === "undefined") return;

  ensureUtf8Charset();
  updateMetaTag("viewport", "width=device-width, initial-scale=1");
  updateMetaTag("theme-color", "#6366f1");
  updateLinkTag("icon", "/favicon.ico");
  updateLinkTag("apple-touch-icon", "/logo192.png");
  updateMetaTag("author", "Anthony MrGuru Feaster");
  updateMetaTag("robots", "index, follow");

  document.title =
    "Anthony MrGuru Feaster | Senior Full Stack Developer | Ascendra Technologies";

  updateMetaTag(
    "description",
    "Anthony MrGuru Feaster is a Senior Full Stack Developer at Ascendra Technologies. Explore projects, skills, and start your next web project with a proven professional.",
  );

  updateMetaTag("og:type", "website", true);
  updateMetaTag("og:url", "https://mrguru.dev/", true);
  updateMetaTag(
    "og:title",
    "Anthony MrGuru Feaster | Senior Full Stack Developer | Ascendra Technologies",
    true,
  );
  updateMetaTag(
    "og:description",
    "Senior Full Stack Developer at Ascendra Technologies. Explore projects and start your next web project with a proven professional.",
    true,
  );
  updateMetaTag(
    "og:image",
    "https://mrguru.dev/images/mrguru-og-image.jpg",
    true,
  );

  updateMetaTag("twitter:card", "summary_large_image");
  updateMetaTag("twitter:url", "https://mrguru.dev/");
  updateMetaTag(
    "twitter:title",
    "Anthony MrGuru Feaster | Senior Full Stack Developer | Ascendra Technologies",
  );
  updateMetaTag(
    "twitter:description",
    "Senior Full Stack Developer at Ascendra Technologies. Start your next web project with a proven professional.",
  );
  updateMetaTag(
    "twitter:image",
    "https://mrguru.dev/images/mrguru-og-image.jpg",
  );

  clearArticleTagMetas();
}
