/**
 * Imperative <head> updates for client-side SPAs (legacy Vite client).
 * Keeps a single meta/link per selector and supports JSON-LD script slots.
 */

function assertSafeMetaKey(key: string): void {
  if (!/^[a-zA-Z0-9:_./-]+$/.test(key)) {
    throw new Error(`Unsafe meta key: ${key}`);
  }
}

export function updateMetaTag(
  property: string,
  content: string,
  isProperty = false,
): void {
  if (typeof document === "undefined") return;

  assertSafeMetaKey(property);
  const attribute = isProperty ? "property" : "name";
  let element = document.querySelector(
    `meta[${attribute}="${property}"]`,
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, property);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function updateLinkTag(rel: string, href: string): void {
  if (typeof document === "undefined") return;

  assertSafeMetaKey(rel);
  let element = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export function updateJsonLdScript(data: object, id: string): void {
  if (typeof document === "undefined") return;

  assertSafeMetaKey(id);
  const existingScript = document.querySelector(
    `script[type="application/ld+json"][data-seo-id="${id}"]`,
  );
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-seo-id", id);
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function removeJsonLdScript(id: string): void {
  if (typeof document === "undefined") return;
  assertSafeMetaKey(id);
  document
    .querySelectorAll(
      `script[type="application/ld+json"][data-seo-id="${id}"]`,
    )
    .forEach((el) => el.remove());
}

/** Replace all Open Graph article:tag metas (variable cardinality). */
export function setArticleTagMetas(tags: string[]): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll('meta[property="article:tag"]').forEach((el) => {
    el.remove();
  });
  for (const tag of tags) {
    const element = document.createElement("meta");
    element.setAttribute("property", "article:tag");
    element.setAttribute("content", tag);
    document.head.appendChild(element);
  }
}

export function clearArticleTagMetas(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll('meta[property="article:tag"]').forEach((el) => {
    el.remove();
  });
}

export function ensureUtf8Charset(): void {
  if (typeof document === "undefined") return;
  let el = document.querySelector("meta[charset]") as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("charset", "utf-8");
    document.head.prepend(el);
  }
}
