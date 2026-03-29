import type { AppLocale } from "./constants";
import {
  BRAND_GROWTH_PATH,
  CHALLENGE_LANDING_PATH,
  DIAGNOSTICS_HUB_PATH,
  DIGITAL_GROWTH_AUDIT_PATH,
  FREE_GROWTH_TOOLS_PATH,
  FREE_TRIAL_PATH,
  GROWTH_DIAGNOSIS_ENGINE_PATH,
  LAUNCH_YOUR_BRAND_PATH,
  MARKETING_ASSETS_PATH,
  PPC_LEAD_MAGNET_PATH,
  PRIMARY_CTA,
  PROJECT_GROWTH_ASSESSMENT_PATH,
  REBRAND_YOUR_BUSINESS_PATH,
  SECONDARY_CTA,
  STARTUP_GROWTH_KIT_PATH,
  STRATEGY_CALL_PATH,
} from "@/lib/funnelCtas";

/** Spanish labels keyed by exact `href` from `siteNavLinks` (paths imported for parity). */
const LINK_ES: Record<string, string> = {
  "/": "Inicio",
  "/services": "Servicios",
  [FREE_GROWTH_TOOLS_PATH]: "Centro de herramientas gratis",
  [DIAGNOSTICS_HUB_PATH]: "Elige tu diagnóstico",
  [FREE_TRIAL_PATH]: "Prueba gratis",
  "/about": "Acerca de",
  "/diagnosis/results": "Tu puntuación de crecimiento",
  "/blog": "Blog",
  "/contact": "Contacto",
  [GROWTH_DIAGNOSIS_ENGINE_PATH]: "Diagnóstico gratuito",
  [DIGITAL_GROWTH_AUDIT_PATH]: "Auditoría gratuita",
  [PPC_LEAD_MAGNET_PATH]: "PPC y sistemas de leads",
  [CHALLENGE_LANDING_PATH]: "Reto de 5 días (de pago)",
  [PROJECT_GROWTH_ASSESSMENT_PATH]: "Evaluación de crecimiento (completa)",
  [BRAND_GROWTH_PATH]: "Crecimiento de marca",
  "/Afn": "Comunidad",
  "/website-breakdowns": "Análisis de sitios web",
  [LAUNCH_YOUR_BRAND_PATH]: "Lanza tu marca",
  [REBRAND_YOUR_BUSINESS_PATH]: "Renueva tu negocio",
  [MARKETING_ASSETS_PATH]: "Activos de marketing",
  [STRATEGY_CALL_PATH]: "Llamada de estrategia",
  [STARTUP_GROWTH_KIT_PATH]: "Kit de crecimiento para startups",
  "/partners/ascendra-technologies#projects": "Nuestro trabajo",
  "/contractor-systems": "Para contratistas",
  "/local-business-growth": "Negocio local",
  "/startup-mvp-development": "MVP para startups",
  "/terms": "Términos del servicio",
  "/privacy": "Política de privacidad",
  "/data-deletion-request": "Solicitar eliminación de datos",
};

/** Primary / secondary footer CTAs (audit + strategy call). */
export function footerPrimaryCta(locale: AppLocale): string {
  if (locale === "es") {
    return "Solicita tu auditoría de crecimiento digital";
  }
  return PRIMARY_CTA;
}

export function footerSecondaryCta(locale: AppLocale): string {
  if (locale === "es") {
    return "Reserva una llamada gratuita";
  }
  return SECONDARY_CTA;
}

export function footerLinkLabel(href: string, englishLabel: string, locale: AppLocale): string {
  if (locale === "en") return englishLabel;
  return LINK_ES[href] ?? englishLabel;
}

export function footerSectionTitle(
  key: "main" | "growth" | "who" | "legal" | "contact",
  locale: AppLocale,
): string {
  if (locale === "en") {
    const titles = {
      main: "Main",
      growth: "Growth",
      who: "Who we serve",
      legal: "Legal",
      contact: "Contact",
    } as const;
    return titles[key];
  }
  const titlesEs = {
    main: "Principal",
    growth: "Crecimiento",
    who: "A quién servimos",
    legal: "Legal",
    contact: "Contacto",
  } as const;
  return titlesEs[key];
}

export function footerPartnershipLine(locale: AppLocale): string {
  if (locale === "es") {
    return "Desarrollado en colaboración con Style Studio Branding y Macon Designs®.";
  }
  return "Built in partnership with Style Studio Branding and Macon Designs®.";
}

export function footerCopyrightLine(locale: AppLocale, year: number): string {
  if (locale === "es") {
    return `© ${year} Ascendra Technologies. Todos los derechos reservados.`;
  }
  return `© ${year} Ascendra Technologies. All rights reserved.`;
}

export function footerAriaLabel(locale: AppLocale): string {
  return locale === "es" ? "Pie de página del sitio" : "Site footer";
}

export function footerNavAriaLabel(locale: AppLocale): string {
  return locale === "es" ? "Navegación del pie de página" : "Footer navigation";
}

/** Language switcher copy. */
export function footerLangLabel(locale: AppLocale): string {
  return locale === "es" ? "Idioma" : "Language";
}

export function footerLangEnglishLabel(locale: AppLocale): string {
  return locale === "es" ? "Inglés" : "English";
}

/** Keep “Español” as the language endonym in both locales. */
export function footerLangSpanishLabel(): string {
  return "Español";
}

export function footerLangGroupAria(locale: AppLocale): string {
  return locale === "es" ? "Elegir idioma" : "Choose language";
}
