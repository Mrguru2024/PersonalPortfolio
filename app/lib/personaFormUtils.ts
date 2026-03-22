/** Split multiline text into non-empty trimmed lines (marketing persona list fields). */
export function linesToStringArray(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}
