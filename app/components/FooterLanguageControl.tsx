"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { AppLocale } from "@/lib/i18n/constants";
import {
  footerLangEnglishLabel,
  footerLangGroupAria,
  footerLangLabel,
  footerLangSpanishLabel,
} from "@/lib/i18n/footerCopy";

function LangButton({
  code,
  label,
  active,
  onSelect,
}: {
  code: AppLocale;
  label: string;
  active: boolean;
  onSelect: (code: AppLocale) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(code)}
      className={
        active
          ? "font-semibold text-foreground underline underline-offset-2"
          : "hover:text-foreground transition-colors"
      }
    >
      {label}
    </button>
  );
}

/** Footer EN/ES toggle: persists to cookie + localStorage for toasts and `lang` on `<html>`. */
export function FooterLanguageControl() {
  const { locale, setLocale } = useLocale();
  const langHeading = footerLangLabel(locale);
  const enLabel = footerLangEnglishLabel(locale);
  const esLabel = footerLangSpanishLabel();
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground" suppressHydrationWarning>
      <span className="font-semibold uppercase tracking-wider">{langHeading}</span>
      <span className="flex items-center gap-1.5" role="group" aria-label={footerLangGroupAria(locale)}>
        <LangButton code="en" label={enLabel} active={locale === "en"} onSelect={setLocale} />
        <span aria-hidden className="text-border">
          |
        </span>
        <LangButton code="es" label={esLabel} active={locale === "es"} onSelect={setLocale} />
      </span>
    </div>
  );
}

export default FooterLanguageControl;
