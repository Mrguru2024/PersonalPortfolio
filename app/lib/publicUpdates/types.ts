export type PublicUpdatesTopic =
  | "marketing"
  | "digital_marketing"
  | "advertising"
  | "ascendra_public";

export type PublicUpdateKind = "ascendra_editorial" | "publisher_feed";

/** Normalized row for `/api/changelog` and the public updates page. */
export type PublicUpdateEntryOut = {
  id: string;
  date: string;
  title: string;
  /** Short summary (card). */
  description: string;
  /** Longer text for expand; optional for sparse RSS items. */
  details: string | null;
  topic: PublicUpdatesTopic;
  /** Legacy editorial subtype for Ascendra-only rows (omit on feeds). */
  category?: "marketing_industry_update" | "persona_interest" | "new_project_intake" | "ascendra_public";
  visibility?: "public";
  /** True when the entry is Ascendra authored/reviewed in `public-updates.json`. */
  factChecked: boolean;
  /** Publisher or "Ascendra". */
  sourceName: string;
  sourceUrl: string | null;
  kind: PublicUpdateKind;
};
