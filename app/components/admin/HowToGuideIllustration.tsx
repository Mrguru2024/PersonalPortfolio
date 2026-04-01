import { cn } from "@/lib/utils";

const frame = "text-primary/40 dark:text-primary/30";

/** Simple topic illustrations for admin how-to cards (SVG, theme-aware). */
export function HowToGuideIllustration({
  guideId,
  className,
}: {
  guideId: string;
  className?: string;
}) {
  const c = cn("w-full max-w-[180px] h-[100px] sm:h-[110px] mx-auto sm:mx-0 shrink-0", className);
  switch (guideId) {
    case "site-directory":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="10" y="14" width="180" height="92" rx="8" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="55" cy="50" r="7" className="text-primary" fill="currentColor" opacity="0.75" />
          <circle cx="100" cy="62" r="7" className="text-primary" fill="currentColor" opacity="0.55" />
          <circle cx="145" cy="46" r="7" className="text-primary" fill="currentColor" opacity="0.4" />
          <path d="M55 57 L100 69 M100 55 L145 53" stroke="currentColor" strokeWidth="1.25" className="text-primary/45" />
          <rect x="24" y="84" width="120" height="7" rx="2" className="text-muted-foreground/35" fill="currentColor" />
        </svg>
      );
    case "crm-contact":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="42" y="22" width="116" height="76" rx="10" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="50" r="13" className="text-primary/80" fill="currentColor" />
          <path d="M72 86 q28-18 56 0" stroke="currentColor" strokeWidth="2" className="text-primary/55" fill="none" strokeLinecap="round" />
          <rect x="60" y="94" width="80" height="6" rx="2" className="text-muted-foreground/35" fill="currentColor" />
        </svg>
      );
    case "ltv":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="16" y="20" width="168" height="80" rx="8" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <rect x="36" y="72" width="18" height="24" rx="2" className="text-primary/60" fill="currentColor" />
          <rect x="68" y="56" width="18" height="40" rx="2" className="text-primary/50" fill="currentColor" />
          <rect x="100" y="44" width="18" height="52" rx="2" className="text-primary/70" fill="currentColor" />
          <rect x="132" y="64" width="18" height="32" rx="2" className="text-primary/45" fill="currentColor" />
          <rect x="86" y="22" width="28" height="14" rx="3" className="text-primary/55" fill="currentColor" />
        </svg>
      );
    case "discovery":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="48" y="28" width="104" height="68" rx="8" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="54" r="12" className="text-primary/25" stroke="currentColor" strokeWidth="2" />
          <polygon points="100,44 107,58 93,58" className="text-primary/70" fill="currentColor" />
          <rect x="62" y="88" width="76" height="10" rx="2" className="text-muted-foreground/35" fill="currentColor" />
        </svg>
      );
    case "amie":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <circle cx="100" cy="60" r="36" className={frame} stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M100 24 L130 60 L100 96 L70 60 Z"
            className="text-primary/50"
            stroke="currentColor"
            strokeWidth="1.25"
            fill="currentColor"
            fillOpacity="0.15"
          />
          <circle cx="100" cy="60" r="6" className="text-primary" fill="currentColor" />
        </svg>
      );
    case "growth-os":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="20" y="26" width="48" height="36" rx="4" className="text-primary/45" fill="currentColor" />
          <rect x="76" y="26" width="48" height="36" rx="4" className="text-primary/35" fill="currentColor" />
          <rect x="132" y="26" width="48" height="36" rx="4" className="text-primary/55" fill="currentColor" />
          <rect x="20" y="70" width="160" height="28" rx="6" className={frame} stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "content-studio":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="32" y="22" width="96" height="76" rx="6" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <line x1="44" y1="40" x2="116" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary/50" strokeLinecap="round" />
          <line x1="44" y1="52" x2="100" y2="52" stroke="currentColor" strokeWidth="2" className="text-primary/35" strokeLinecap="round" />
          <rect x="136" y="30" width="40" height="52" rx="4" className="text-primary/40" fill="currentColor" />
          <circle cx="156" cy="46" r="4" className="text-background" fill="currentColor" />
        </svg>
      );
    case "email-hub":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="40" y="36" width="120" height="64" rx="8" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <path d="M48 44 L100 78 L152 44" stroke="currentColor" strokeWidth="2" className="text-primary/55" strokeLinejoin="round" />
          <circle cx="100" cy="56" r="6" className="text-primary/70" fill="currentColor" />
        </svg>
      );
    case "integrations":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <circle cx="58" cy="60" r="22" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="142" cy="60" r="22" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <path d="M80 60 H120" stroke="currentColor" strokeWidth="2" className="text-primary/60" />
          <path d="M112 52 L124 60 L112 68" stroke="currentColor" strokeWidth="2" className="text-primary/60" fill="none" />
        </svg>
      );
    case "settings":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <circle cx="100" cy="60" r="28" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="60" r="10" className="text-primary/60" fill="currentColor" />
          <rect x="96" y="28" width="8" height="14" rx="2" className="text-primary/50" fill="currentColor" />
          <rect x="96" y="78" width="8" height="14" rx="2" className="text-primary/50" fill="currentColor" />
          <rect x="62" y="56" width="14" height="8" rx="2" className="text-primary/40" fill="currentColor" />
          <rect x="124" y="56" width="14" height="8" rx="2" className="text-primary/40" fill="currentColor" />
        </svg>
      );
    case "agent-knowledge":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <path
            d="M52 28 H124 Q138 28 138 42 V88 Q138 98 124 98 H60 Q46 98 46 88 V38 Q46 28 52 28"
            className={frame}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <path
            d="M120 28 V42 Q120 52 130 52 H148"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-primary/45"
            fill="none"
          />
          <circle cx="154" cy="36" r="22" className="text-primary/35" fill="currentColor" />
          <path d="M146 36 h16 M154 28 v16" stroke="currentColor" strokeWidth="2" className="text-primary" />
        </svg>
      );
    case "offer-persona-iq":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <path
            d="M100 28 C72 28 54 48 54 72 C54 88 62 100 72 104 L128 104 C138 100 146 88 146 72 C146 48 128 28 100 28"
            className="text-primary/25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <circle cx="82" cy="64" r="10" className="text-primary/55" fill="currentColor" />
          <circle cx="118" cy="64" r="10" className="text-primary/55" fill="currentColor" />
          <path d="M88 88 Q100 96 112 88" stroke="currentColor" strokeWidth="2" className="text-primary/45" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "paid-growth":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <path d="M28 88 L60 52 L88 68 L120 36 L152 56 L172 44" stroke="currentColor" strokeWidth="2.5" className="text-primary/55" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="100,22 112,42 88,42" className="text-primary/70" fill="currentColor" />
        </svg>
      );
    case "experiments-ab-testing":
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="28" y="34" width="56" height="56" rx="6" className="text-primary/35" fill="currentColor" />
          <rect x="116" y="34" width="56" height="56" rx="6" className="text-primary/22" fill="currentColor" />
          <ellipse cx="56" cy="62" rx="10" ry="6" className="text-primary/55" fill="currentColor" />
          <ellipse cx="144" cy="62" rx="10" ry="6" className="text-primary/40" fill="currentColor" />
          <path
            d="M92 62 H108"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/50"
            strokeDasharray="4 3"
          />
        </svg>
      );
    default:
      return (
        <svg className={c} viewBox="0 0 200 120" fill="none" aria-hidden>
          <rect x="30" y="28" width="140" height="64" rx="8" className={frame} stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="60" r="18" className="text-primary/35" fill="currentColor" />
        </svg>
      );
  }
}
