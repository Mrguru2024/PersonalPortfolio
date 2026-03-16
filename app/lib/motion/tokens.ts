/**
 * Motion design tokens for Ascendra — premium, precise, conversion-aware.
 * Use with Framer Motion; respect prefers-reduced-motion in consumers.
 */

export const motionTokens = {
  /** Hover / microinteraction: 150–220ms */
  hover: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  /** Section / block reveal: 400–700ms */
  reveal: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  /** Hero entrance: 600–1000ms */
  hero: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  /** Stagger step between children (ms) */
  staggerStep: 80,
  /** Stagger step for hero (slightly slower) */
  heroStaggerStep: 100,
} as const;

export const heroChoreography = {
  headline: { delay: 0.1, duration: 0.7, y: 24, blur: 8 },
  subline: { delay: 0.35, duration: 0.55, y: 16 },
  ctas: { delay: 0.55, duration: 0.5, y: 12 },
  card: { delay: 0, duration: 0.6, y: 20, scale: 0.98 },
} as const;

export const cardDock = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
  y: 24,
  opacity: 0,
} as const;

export const spotlight = {
  /** Transition for spotlight position (throttled in component) */
  followDuration: 0.25,
  /** Lift on hover (px) */
  liftY: -4,
  /** Hover duration */
  hoverDuration: 0.22,
} as const;

export const magnetic = {
  /** Max pull distance (px) */
  maxPull: 12,
  /** Spring response */
  stiffness: 150,
  damping: 15,
} as const;
