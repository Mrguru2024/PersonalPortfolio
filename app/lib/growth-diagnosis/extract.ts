/**
 * Ascendra Growth Diagnosis Engine — HTML extraction.
 * Parses crawled HTML into structured page data for rule checks.
 */

import { parse } from "node-html-parser";
import type { ExtractedPage } from "./types";

const CTA_LIKE = /^(book|get|start|request|schedule|contact|call|submit|sign up|join|try|demo|learn more|see more|request a quote|get started|free consultation|request audit)/i;
const TRUST_LIKE = /testimonial|review|rating|trust|award|certified|badge|client|customer|as seen on/i;
const PHONE_REGEX = /^tel:/i;
const MAILTO_REGEX = /^mailto:/i;

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, "") || u.origin + "/";
  } catch {
    return url;
  }
}

export function extractFromHtml(html: string, pageUrl: string): ExtractedPage {
  const root = parse(html, { lowerCaseTagName: true });
  const baseUrl = normalizeUrl(pageUrl);

  const titleEl = root.querySelector("title");
  const title = titleEl?.text?.trim() || null;

  const metaDesc = root.querySelector('meta[name="description"]');
  const metaDescription = metaDesc?.getAttribute("content")?.trim() || null;

  const h1s = root.querySelectorAll("h1");
  const h1Texts = h1s.map((h) => h.text?.trim()).filter(Boolean) as string[];

  const headings: { level: number; text: string }[] = [];
  for (let level = 1; level <= 6; level++) {
    root.querySelectorAll(`h${level}`).forEach((el) => {
      const text = el.text?.trim();
      if (text) headings.push({ level, text });
    });
  }

  const paragraphs = root.querySelectorAll("p");
  let wordCount = 0;
  paragraphs.forEach((p) => {
    const t = p.text?.trim() || "";
    wordCount += t.split(/\s+/).filter(Boolean).length;
  });

  const buttons = root.querySelectorAll("button, [role=button], a.button, .btn, input[type=submit]");
  const ctaButtons: { text: string; visible: boolean }[] = [];
  buttons.forEach((el) => {
    const text = (el.text?.trim() || el.getAttribute("value") || "").slice(0, 80);
    if (!text) return;
    const visible = true;
    ctaButtons.push({ text, visible });
  });
  const links = root.querySelectorAll('a[href]');
  links.forEach((a) => {
    const text = a.text?.trim()?.slice(0, 80) || "";
    const href = a.getAttribute("href") || "";
    if (!text || (!href || href === "#")) return;
    if (CTA_LIKE.test(text) || CTA_LIKE.test(href)) ctaButtons.push({ text, visible: true });
  });

  let hasForm = root.querySelector("form") !== null;
  let hasPhoneLink = false;
  let hasEmailLink = false;
  let internalLinks = 0;
  let externalLinks = 0;
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    if (PHONE_REGEX.test(href)) hasPhoneLink = true;
    if (MAILTO_REGEX.test(href)) hasEmailLink = true;
    if (!href || href === "#") return;
    try {
      const full = href.startsWith("http") ? href : new URL(href, baseUrl).href;
      if (new URL(full).origin === new URL(baseUrl).origin) internalLinks++;
      else externalLinks++;
    } catch {
      internalLinks++;
    }
  });

  const images = root.querySelectorAll("img");
  const imageCount = images.length;
  let imagesWithAlt = 0;
  images.forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt != null && alt.trim().length > 0) imagesWithAlt++;
  });

  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  const hasSchema = scripts.length > 0;

  const trustSignals: string[] = [];
  const bodyText = root.querySelector("body")?.text || "";
  if (TRUST_LIKE.test(bodyText)) trustSignals.push("Review/testimonial language");
  if (root.querySelector("[class*='testimonial'], [id*='testimonial']")) trustSignals.push("Testimonial section");
  if (root.querySelector("[class*='review'], [class*='rating']")) trustSignals.push("Reviews/ratings");

  const locationMentions = (bodyText.match(/\b(address|location|city|state|zip|phone|hours)\b/gi) || []).length;

  const socialSignals = root.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"], a[href*="youtube"]');
  const socialLinks = Array.from(new Set(socialSignals.map((a) => a.getAttribute("href") || "").filter(Boolean)));

  const viewport = root.querySelector('meta[name="viewport"]');
  const viewportMeta = viewport !== null;

  return {
    url: pageUrl,
    title,
    metaDescription,
    h1Count: h1s.length,
    h1Texts,
    headings,
    paragraphCount: paragraphs.length,
    wordCount,
    ctaButtons,
    hasForm,
    hasPhoneLink,
    hasEmailLink,
    internalLinks,
    externalLinks,
    imageCount,
    imagesWithAlt,
    hasSchema,
    trustSignals,
    locationMentions,
    socialLinks,
    viewportMeta,
  };
}

export function getDefaultUrlsToCrawl(origin: string): string[] {
  const base = origin.replace(/\/$/, "");
  return [
    `${base}/`,
    `${base}/contact`,
    `${base}/about`,
    `${base}/services`,
    `${base}/book`,
    `${base}/request-quote`,
    `${base}/pricing`,
    `${base}/locations`,
  ].filter((u, i, arr) => arr.indexOf(u) === i);
}
