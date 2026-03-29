import type { AppLocale } from "./constants";
import { footerLinkLabel } from "./footerCopy";

const SECTION_LABEL_ES: Record<string, string> = {
  "Service offerings": "Ofertas de servicio",
  "Who we serve": "A quién servimos",
  Company: "Empresa",
  "Assess & grow": "Evalúa y crece",
  Resources: "Recursos",
};

export function shellSectionLabel(english: string, locale: AppLocale): string {
  if (locale === "en") return english;
  return SECTION_LABEL_ES[english] ?? english;
}

export function shellServicesTrigger(locale: AppLocale): string {
  return locale === "es" ? "Servicios" : "Services";
}

export function shellMoreTrigger(locale: AppLocale): string {
  return locale === "es" ? "Más" : "More";
}

export function shellMainNavAria(locale: AppLocale): string {
  return locale === "es" ? "Navegación principal" : "Main navigation";
}

export function shellHomeLogoAria(locale: AppLocale): string {
  return locale === "es" ? "Ascendra Technologies – Inicio" : "Ascendra Technologies – Home";
}

/** Header / mobile CTA — scroll or link to strategy call. */
export function shellHeaderBookCall(locale: AppLocale): string {
  return locale === "es" ? "Reservar una llamada" : "Book a call";
}

export function shellLogin(locale: AppLocale): string {
  return locale === "es" ? "Iniciar sesión" : "Login";
}

export function shellLogOut(locale: AppLocale): string {
  return locale === "es" ? "Cerrar sesión" : "Log out";
}

export function shellPublicDashboard(locale: AppLocale): string {
  return locale === "es" ? "Panel" : "Dashboard";
}

export function shellAdminSectionLabel(locale: AppLocale): string {
  return locale === "es" ? "Administración" : "Admin";
}

export function shellLoggedInAs(locale: AppLocale, username: string): string {
  return locale === "es"
    ? `Sesión iniciada como @${username}`
    : `Logged in as @${username}`;
}

export function shellMobileNavAria(locale: AppLocale): string {
  return locale === "es" ? "Navegación móvil" : "Mobile navigation";
}

export function shellOpenMenuAria(open: boolean, locale: AppLocale): string {
  if (locale === "es") return open ? "Cerrar menú" : "Abrir menú";
  return open ? "Close menu" : "Open menu";
}

export function shellMenuButtonText(open: boolean, locale: AppLocale): string {
  if (locale === "es") return open ? "Cerrar" : "Menú";
  return open ? "Close" : "Menu";
}

export function shellPrimaryLinksAria(locale: AppLocale): string {
  return locale === "es" ? "Enlaces principales" : "Primary links";
}

export function shellNavItemLabel(href: string, englishName: string, locale: AppLocale): string {
  return footerLinkLabel(href, englishName, locale);
}

export function shellMobileBottomHome(locale: AppLocale): string {
  return locale === "es" ? "Inicio" : "Home";
}

export function shellMobileBottomTools(locale: AppLocale): string {
  return locale === "es" ? "Herramientas" : "Tools";
}

export function shellMobileBottomBlog(locale: AppLocale): string {
  return footerLinkLabel("/blog", "Blog", locale);
}

export function shellMobileBottomBook(locale: AppLocale): string {
  return locale === "es" ? "Reservar" : "Book";
}

export function shellMobileBottomMenu(locale: AppLocale): string {
  return locale === "es" ? "Menú" : "Menu";
}

export function shellTrialDaysWord(days: number, locale: AppLocale): string {
  if (locale === "es") return days === 1 ? "día" : "días";
  return days === 1 ? "day" : "days";
}

export function shellTrialOpenDashboard(locale: AppLocale): string {
  return locale === "es" ? "Abre tu panel" : "Open your dashboard";
}

export function shellTrialBookStrategyCall(locale: AppLocale): string {
  return locale === "es" ? "Reserva una llamada de estrategia" : "Book a strategy call";
}
