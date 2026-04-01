import type { PublicProfileLayout, PublicProfileStyle } from "@shared/publicProfileStyle";
import { isAfnProfileFontPresetId } from "@/lib/community/profileFonts";

const LAYOUTS = new Set<PublicProfileLayout>(["editorial", "hero", "bento", "minimal"]);
const RADII = new Set<NonNullable<PublicProfileStyle["radius"]>>(["sm", "md", "lg", "xl"]);
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * DB / RSC may expose `public_profile_style_json` as an object or a JSON string.
 * Spreading a string in `mergePublicProfileStyle` produced wrong `layout` on SSR vs hydrated client.
 */
export function normalizePublicProfileStyleJson(raw: unknown): PublicProfileStyle | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      return normalizePublicProfileStyleJson(JSON.parse(t) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PublicProfileStyle;
  }
  return null;
}

function normalizeHex(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "") return null;
  return HEX.test(s) ? s : undefined;
}

/** Merge validated patch into existing style (partial updates). */
export function mergePublicProfileStyle(existing: unknown, patch: unknown): PublicProfileStyle {
  const normalized = normalizePublicProfileStyleJson(existing);
  const base: PublicProfileStyle = { ...(normalized ?? {}) };
  if (patch === null || patch === undefined) return base;
  if (typeof patch !== "object") return base;
  const p = patch as Record<string, unknown>;

  if ("layout" in p) {
    if (p.layout === null || p.layout === "") delete base.layout;
    else if (typeof p.layout === "string" && LAYOUTS.has(p.layout as PublicProfileLayout)) {
      base.layout = p.layout as PublicProfileLayout;
    }
  }
  if ("fontPreset" in p) {
    if (p.fontPreset === null || p.fontPreset === "") delete base.fontPreset;
    else if (typeof p.fontPreset === "string" && isAfnProfileFontPresetId(p.fontPreset)) {
      base.fontPreset = p.fontPreset;
    }
  }
  if ("customFontUrl" in p) {
    if (p.customFontUrl === null || p.customFontUrl === "") base.customFontUrl = null;
    else if (typeof p.customFontUrl === "string") {
      const url = p.customFontUrl.trim().slice(0, 2000);
      if (url.startsWith("/uploads/profile-fonts/")) base.customFontUrl = url;
    }
  }
  if ("customFontFamily" in p) {
    if (p.customFontFamily === null || p.customFontFamily === "")
      base.customFontFamily = null;
    else if (typeof p.customFontFamily === "string") {
      const name = p.customFontFamily.trim().slice(0, 120);
      base.customFontFamily = name.replace(/[<>'"]/g, "") || null;
    }
  }
  if ("primaryHex" in p) {
    const h = normalizeHex(p.primaryHex);
    if (h === undefined) {
      /* skip invalid */
    } else if (h === null) base.primaryHex = null;
    else base.primaryHex = h;
  }
  if ("surfaceHex" in p) {
    const h = normalizeHex(p.surfaceHex);
    if (h === undefined) {
      /* skip */
    } else if (h === null) base.surfaceHex = null;
    else base.surfaceHex = h;
  }
  if ("radius" in p) {
    if (p.radius === null || p.radius === "") delete base.radius;
    else if (typeof p.radius === "string" && RADII.has(p.radius as NonNullable<PublicProfileStyle["radius"]>)) {
      base.radius = p.radius as NonNullable<PublicProfileStyle["radius"]>;
    }
  }
  if ("motion" in p) {
    if (p.motion === null || p.motion === "") delete base.motion;
    else if (p.motion === "on" || p.motion === "reduced") base.motion = p.motion;
  }

  return base;
}

export const PUBLIC_PROFILE_LAYOUT_LABELS: Record<PublicProfileLayout, string> = {
  editorial: "Editorial",
  hero: "Hero spotlight",
  bento: "Bento grid",
  minimal: "Minimal focus",
};

export function resolveProfileMotion(style: PublicProfileStyle | null | undefined): "on" | "reduced" {
  return style?.motion === "reduced" ? "reduced" : "on";
}
