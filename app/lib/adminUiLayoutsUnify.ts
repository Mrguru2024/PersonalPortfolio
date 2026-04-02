import { DEFAULT_ADMIN_DASHBOARD_ORDER } from "@/lib/adminDashboardLayout";
import { DEFAULT_CRM_DASHBOARD_ORDER } from "@/lib/crmDashboardLayout";
import {
  defaultSurfaceForWidget,
  isAdminWidgetId,
  isMainNativeWidget,
  UNIFIED_LAYOUT_SURFACE_IDS,
  type AdminWidgetId,
  type UnifiedLayoutSurfaceId,
} from "@/lib/adminWidgetCatalog";

export type AdminSurfaceLayout = { order: string[]; hidden: string[] };

export type UnifiedAdminLayoutsState = Record<UnifiedLayoutSurfaceId, AdminSurfaceLayout>;

export function emptySurfaceLayout(): AdminSurfaceLayout {
  return { order: [], hidden: [] };
}

function parseSurface(raw: unknown): AdminSurfaceLayout {
  if (!raw || typeof raw !== "object") return emptySurfaceLayout();
  const o = raw as { order?: unknown; hidden?: unknown };
  const order = Array.isArray(o.order)
    ? o.order.filter((x): x is string => typeof x === "string" && isAdminWidgetId(x))
    : [];
  const hidden = Array.isArray(o.hidden)
    ? o.hidden.filter((x): x is string => typeof x === "string" && isAdminWidgetId(x))
    : [];
  return { order, hidden: [...new Set(hidden)] };
}

/**
 * Each widget id appears on at most one surface. Surfaces earlier in
 * `UNIFIED_LAYOUT_SURFACE_IDS` win when healing inconsistent stored data.
 */
export function dedupeWidgetPlacementAcrossSurfaces(
  surfaces: UnifiedAdminLayoutsState,
): UnifiedAdminLayoutsState {
  const placed = new Set<string>();
  const next: UnifiedAdminLayoutsState = {
    main: { order: [], hidden: [] },
    crm: { order: [], hidden: [] },
    analytics: { order: [], hidden: [] },
  };
  for (const sid of UNIFIED_LAYOUT_SURFACE_IDS) {
    const src = surfaces[sid];
    const order: string[] = [];
    for (const id of src.order) {
      if (!isAdminWidgetId(id) || placed.has(id)) continue;
      placed.add(id);
      order.push(id);
    }
    const hidden = [...new Set(src.hidden.filter((id) => isAdminWidgetId(id) && order.includes(id)))];
    next[sid] = { order, hidden };
  }
  return next;
}

/** Hydrate from DB JSON; use full main/crm defaults only when that surface key is absent. */
export function hydrateUnifiedLayoutsFromServer(
  raw: Record<string, { order: string[]; hidden: string[] }> | null | undefined,
): UnifiedAdminLayoutsState {
  const main: AdminSurfaceLayout =
    raw?.main && typeof raw.main === "object" && Array.isArray(raw.main.order)
      ? parseSurface(raw.main)
      : { order: [...DEFAULT_ADMIN_DASHBOARD_ORDER], hidden: [] };

  const crm: AdminSurfaceLayout =
    raw?.crm && typeof raw.crm === "object" && Array.isArray(raw.crm.order)
      ? parseSurface(raw.crm)
      : { order: [...DEFAULT_CRM_DASHBOARD_ORDER], hidden: [] };

  let analytics: AdminSurfaceLayout = emptySurfaceLayout();
  if (raw && Object.prototype.hasOwnProperty.call(raw, "analytics")) {
    analytics = parseSurface(raw.analytics);
  }

  return enforceMainSurfaceNativeWidgetsOnly(dedupeWidgetPlacementAcrossSurfaces({ main, crm, analytics }));
}

/**
 * After drag-reorder on a surface, merge the new visible sequence back into the full order array
 * (hidden entries keep their relative slots).
 */
export function mergeVisibleReorderIntoFullOrder(
  fullOrder: string[],
  hidden: string[],
  nextVisibleOrder: string[],
): string[] {
  const hiddenSet = new Set(hidden);
  const queue = [...nextVisibleOrder];
  const result: string[] = [];
  for (const id of fullOrder) {
    if (hiddenSet.has(id)) {
      result.push(id);
    } else {
      const next = queue.shift();
      if (next) result.push(next);
    }
  }
  for (const rest of queue) {
    result.push(rest);
  }
  return result;
}

/** Main dashboard only hosts main-native modules; relocate CRM/analytics widgets to their home surface. */
export function enforceMainSurfaceNativeWidgetsOnly(state: UnifiedAdminLayoutsState): UnifiedAdminLayoutsState {
  let s = dedupeWidgetPlacementAcrossSurfaces(state);
  const evicted: AdminWidgetId[] = [];
  const nextMainOrder = s.main.order.filter((id) => {
    if (!isAdminWidgetId(id)) return false;
    if (isMainNativeWidget(id)) return true;
    evicted.push(id);
    return false;
  });
  const nextMainHidden = s.main.hidden.filter(
    (id) => !isAdminWidgetId(id) || isMainNativeWidget(id),
  );
  let next: UnifiedAdminLayoutsState = {
    ...s,
    main: { order: nextMainOrder, hidden: nextMainHidden },
  };
  for (const id of evicted) {
    const dest = defaultSurfaceForWidget(id);
    if (!next[dest].order.includes(id)) {
      next[dest] = {
        ...next[dest],
        order: [...next[dest].order, id],
      };
    }
  }
  return dedupeWidgetPlacementAcrossSurfaces(next);
}

export function analyticsLayoutKeyPresent(
  raw: Record<string, unknown> | null | undefined,
): boolean {
  return !!(raw && Object.prototype.hasOwnProperty.call(raw, "analytics"));
}

/** Visible modules for one surface (order minus hidden). */
export function visibleOrderForSurface(layout: AdminSurfaceLayout): string[] {
  const hidden = new Set(layout.hidden);
  return layout.order.filter((id) => !hidden.has(id));
}
