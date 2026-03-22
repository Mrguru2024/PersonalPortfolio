/**
 * Validates a user-supplied origin for server-side HTTP fetches (funnel audit).
 * Blocks private IPs, localhost, and non-https URLs to reduce SSRF risk.
 */

export class PublicHttpsOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicHttpsOriginError";
  }
}

function isPrivateOrBlockedIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((n) => n > 255)) return true;
  if (a === 0 || a === 127) return true;
  if (a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  /** AWS/GCP metadata */
  if (a === 169 && b === 254 && c === 169 && d === 254) return true;
  return false;
}

function isBlockedHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "metadata.google.internal" || h.endsWith(".metadata.google.internal")) return true;
  if (isPrivateOrBlockedIpv4(h)) return true;
  return false;
}

/**
 * Returns canonical origin string `https://hostname` (no path, no trailing slash).
 * @throws PublicHttpsOriginError
 */
export function assertPublicHttpsOriginForAudit(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new PublicHttpsOriginError("Enter a site URL to audit.");
  }
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new PublicHttpsOriginError("That URL is not valid.");
  }
  if (u.protocol !== "https:") {
    throw new PublicHttpsOriginError("Only https:// sites can be audited.");
  }
  if (u.username || u.password) {
    throw new PublicHttpsOriginError("URL must not include a username or password.");
  }
  const host = u.hostname;
  if (!host || host.length > 253) {
    throw new PublicHttpsOriginError("Invalid hostname.");
  }
  if (isBlockedHostname(host)) {
    throw new PublicHttpsOriginError("That host is not allowed (local or private network).");
  }
  return `https://${host.toLowerCase()}`;
}
