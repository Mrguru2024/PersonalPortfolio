/**
 * Curated Google Fonts for AFN public profile typography (~45). Loaded per-view via stylesheet link.
 */
export const AFN_PROFILE_FONT_PRESETS = [
  { id: "inter", label: "Inter", googleFamily: "Inter" },
  { id: "dm-sans", label: "DM Sans", googleFamily: "DM Sans" },
  { id: "plus-jakarta-sans", label: "Plus Jakarta Sans", googleFamily: "Plus Jakarta Sans" },
  { id: "manrope", label: "Manrope", googleFamily: "Manrope" },
  { id: "outfit", label: "Outfit", googleFamily: "Outfit" },
  { id: "sora", label: "Sora", googleFamily: "Sora" },
  { id: "space-grotesk", label: "Space Grotesk", googleFamily: "Space Grotesk" },
  { id: "syne", label: "Syne", googleFamily: "Syne" },
  { id: "figtree", label: "Figtree", googleFamily: "Figtree" },
  { id: "nunito-sans", label: "Nunito Sans", googleFamily: "Nunito Sans" },
  { id: "lato", label: "Lato", googleFamily: "Lato" },
  { id: "montserrat", label: "Montserrat", googleFamily: "Montserrat" },
  { id: "poppins", label: "Poppins", googleFamily: "Poppins" },
  { id: "raleway", label: "Raleway", googleFamily: "Raleway" },
  { id: "rubik", label: "Rubik", googleFamily: "Rubik" },
  { id: "work-sans", label: "Work Sans", googleFamily: "Work Sans" },
  { id: "lexend", label: "Lexend", googleFamily: "Lexend" },
  { id: "source-sans-3", label: "Source Sans 3", googleFamily: "Source Sans 3" },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", googleFamily: "IBM Plex Sans" },
  { id: "jetbrains-mono", label: "JetBrains Mono", googleFamily: "JetBrains Mono" },
  { id: "crimson-pro", label: "Crimson Pro", googleFamily: "Crimson Pro" },
  { id: "lora", label: "Lora", googleFamily: "Lora" },
  { id: "merriweather", label: "Merriweather", googleFamily: "Merriweather" },
  { id: "playfair-display", label: "Playfair Display", googleFamily: "Playfair Display" },
  { id: "fraunces", label: "Fraunces", googleFamily: "Fraunces" },
  { id: "libre-baskerville", label: "Libre Baskerville", googleFamily: "Libre Baskerville" },
  { id: "spectral", label: "Spectral", googleFamily: "Spectral" },
  { id: "cormorant-garamond", label: "Cormorant Garamond", googleFamily: "Cormorant Garamond" },
  { id: "bebas-neue", label: "Bebas Neue", googleFamily: "Bebas Neue" },
  { id: "oswald", label: "Oswald", googleFamily: "Oswald" },
  { id: "archivo-black", label: "Archivo Black", googleFamily: "Archivo Black" },
  { id: "barlow", label: "Barlow", googleFamily: "Barlow" },
  { id: "cabin", label: "Cabin", googleFamily: "Cabin" },
  { id: "karla", label: "Karla", googleFamily: "Karla" },
  { id: "mulish", label: "Mulish", googleFamily: "Mulish" },
  { id: "quicksand", label: "Quicksand", googleFamily: "Quicksand" },
  { id: "ubuntu", label: "Ubuntu", googleFamily: "Ubuntu" },
  { id: "varela-round", label: "Varela Round", googleFamily: "Varela Round" },
  { id: "zilla-slab", label: "Zilla Slab", googleFamily: "Zilla Slab" },
  { id: "dm-serif-display", label: "DM Serif Display", googleFamily: "DM Serif Display" },
  { id: "literata", label: "Literata", googleFamily: "Literata" },
  { id: "noto-sans", label: "Noto Sans", googleFamily: "Noto Sans" },
  { id: "open-sans", label: "Open Sans", googleFamily: "Open Sans" },
  { id: "pt-sans", label: "PT Sans", googleFamily: "PT Sans" },
  { id: "roboto", label: "Roboto", googleFamily: "Roboto" },
] as const;

export type AfnProfileFontPresetId = (typeof AFN_PROFILE_FONT_PRESETS)[number]["id"];

const ID_SET = new Set<string>(AFN_PROFILE_FONT_PRESETS.map((f) => f.id));

export function isAfnProfileFontPresetId(id: string | null | undefined): id is AfnProfileFontPresetId {
  return !!id && ID_SET.has(id);
}

export function getAfnProfileFontPresetById(id: string | null | undefined) {
  return AFN_PROFILE_FONT_PRESETS.find((f) => f.id === id) ?? AFN_PROFILE_FONT_PRESETS[0];
}

/** Google Fonts CSS2 href for a single family (weights 300–700). */
export function profileGoogleFontStylesheetHref(googleFamily: string): string {
  const familyParam = encodeURIComponent(googleFamily).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@300;400;500;600;700&display=swap`;
}
