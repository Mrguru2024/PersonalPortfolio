import type { ReactNode } from "react";
import type { ToastActionElement } from "@/components/ui/toast";
import toastEnglishToSpanish from "./toastEnglishToSpanish.json";
import { translateApiMessage } from "./apiMessages";
import { getClientLocale } from "./runtime";
import { resolveToastTemplate } from "./toastTemplates";

export type LocalizedToastProps = {
  title?: ReactNode;
  description?: ReactNode;
  titleKey?: string;
  descriptionKey?: string;
  values?: Record<string, string | number>;
  variant?: "default" | "destructive";
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  action?: ToastActionElement;
};

export type ResolvedToastProps = Omit<
  LocalizedToastProps,
  "titleKey" | "descriptionKey" | "values"
>;

const toastMap = toastEnglishToSpanish as Record<string, string>;

function localizePhrase(text: string): string {
  if (getClientLocale() === "en") return text;
  const mapped = toastMap[text];
  if (mapped) return mapped;
  return translateApiMessage(text);
}

/** Resolve i18n keys, phrase-map entries, and API messages for a toast payload. */
export function localizeToastCall(props: LocalizedToastProps): ResolvedToastProps {
  const {
    titleKey,
    descriptionKey,
    values,
    title,
    description,
    ...rest
  } = props;

  const next: ResolvedToastProps = { ...rest };

  if (titleKey) {
    next.title = resolveToastTemplate(titleKey, values);
  } else if (typeof title === "string") {
    next.title = localizePhrase(title);
  } else if (title !== undefined) {
    next.title = title;
  }

  if (descriptionKey) {
    next.description = resolveToastTemplate(descriptionKey, values);
  } else if (typeof description === "string") {
    next.description = localizePhrase(description);
  } else if (description !== undefined) {
    next.description = description;
  }

  return next;
}
