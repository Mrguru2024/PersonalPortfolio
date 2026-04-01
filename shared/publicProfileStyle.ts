/**
 * Persisted “look & feel” for AFN public member profiles (`afn_profiles.public_profile_style_json`).
 */
export type PublicProfileLayout = "editorial" | "hero" | "bento" | "minimal";

export type PublicProfileStyle = {
  layout?: PublicProfileLayout;
  /** Preset id from `AFN_PROFILE_FONT_PRESETS` (e.g. `inter`). Ignored when custom font is set. */
  fontPreset?: string;
  customFontUrl?: string | null;
  customFontFamily?: string | null;
  /** Optional accent override `#rgb` or `#rrggbb` */
  primaryHex?: string | null;
  /** Optional card/surface tint */
  surfaceHex?: string | null;
  radius?: "sm" | "md" | "lg" | "xl";
  motion?: "on" | "reduced";
};
