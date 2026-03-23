/**
 * Development-only console helpers. In production builds these are no-ops so
 * credentials, API bodies, and PII never reach the browser console.
 * Never pass passwords, tokens, session ids, or raw fetch responses here.
 */

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function devLog(...args: unknown[]): void {
  if (isDev()) console.log(...args);
}

export function devWarn(...args: unknown[]): void {
  if (isDev()) console.warn(...args);
}

export function devError(...args: unknown[]): void {
  if (isDev()) console.error(...args);
}
