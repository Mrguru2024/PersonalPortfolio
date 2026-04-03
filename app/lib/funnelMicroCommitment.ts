const STORAGE_KEY = "ascendra_os_micro_funnel_v1";

export type FunnelMicroProgress = {
  version: 1;
  completedSurfaces: string[];
  firstTouchSurface?: string;
  updatedAt: string;
};

function read(): FunnelMicroProgress {
  if (typeof window === "undefined") {
    return { version: 1, completedSurfaces: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, completedSurfaces: [], updatedAt: new Date().toISOString() };
    const p = JSON.parse(raw) as FunnelMicroProgress;
    if (p?.version !== 1 || !Array.isArray(p.completedSurfaces)) {
      return { version: 1, completedSurfaces: [], updatedAt: new Date().toISOString() };
    }
    return p;
  } catch {
    return { version: 1, completedSurfaces: [], updatedAt: new Date().toISOString() };
  }
}

function write(p: FunnelMicroProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("ascendra-funnel-progress"));
  } catch {
    /* ignore */
  }
}

export function getFunnelMicroProgress(): FunnelMicroProgress {
  return read();
}

/** Mark a funnel surface completed (idempotent). */
export function markFunnelSurfaceComplete(surfaceKey: string, options?: { asFirstTouch?: boolean }) {
  const cur = read();
  const set = new Set(cur.completedSurfaces);
  set.add(surfaceKey);
  const next: FunnelMicroProgress = {
    version: 1,
    completedSurfaces: [...set],
    firstTouchSurface:
      options?.asFirstTouch && !cur.firstTouchSurface ? surfaceKey : cur.firstTouchSurface,
    updatedAt: new Date().toISOString(),
  };
  write(next);
}

export function isFunnelSurfaceComplete(surfaceKey: string): boolean {
  return read().completedSurfaces.includes(surfaceKey);
}

export function isPrerequisiteComplete(prerequisiteSurfaceKey: string | null | undefined): boolean {
  if (!prerequisiteSurfaceKey?.trim()) return true;
  return isFunnelSurfaceComplete(prerequisiteSurfaceKey.trim());
}
