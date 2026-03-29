"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { AdminSettingsApiPayload } from "@/lib/adminSettingsResponse";
import { ADMIN_UI_LAYOUT_SURFACE_MAIN } from "@/lib/adminUiLayoutSurfaces";
import {
  adminDashboardLayoutStorageKey,
  normalizeLayout,
  parseStoredLayout,
  type AdminDashboardSectionId,
  DEFAULT_ADMIN_DASHBOARD_ORDER,
} from "@/lib/adminDashboardLayout";
import { DEFAULT_CRM_DASHBOARD_ORDER } from "@/lib/crmDashboardLayout";
import {
  hydrateUnifiedLayoutsFromServer,
  dedupeWidgetPlacementAcrossSurfaces,
  visibleOrderForSurface,
  analyticsLayoutKeyPresent,
  type UnifiedAdminLayoutsState,
} from "@/lib/adminUiLayoutsUnify";
import type { UnifiedLayoutSurfaceId, AdminWidgetId } from "@/lib/adminWidgetCatalog";
import { UNIFIED_LAYOUT_SURFACE_IDS } from "@/lib/adminWidgetCatalog";

const SETTINGS_KEY = ["/api/admin/settings"] as const;

export function useUnifiedAdminLayouts() {
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const enabled = !!user?.isAdmin && !!user?.adminApproved;
  const userId = user?.id != null ? Number(user.id) : null;
  const migratedRef = useRef(false);

  const { data, isLoading, isFetched } = useQuery<AdminSettingsApiPayload>({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled || !data || userId == null || migratedRef.current) return;
    if (data.adminUiLayouts?.main) return;
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(adminDashboardLayoutStorageKey(userId)) : null;
    const parsed = parseStoredLayout(raw);
    if (!parsed) return;
    migratedRef.current = true;
    const normalized = normalizeLayout(parsed);
    void (async () => {
      try {
        const res = await apiRequest("PATCH", "/api/admin/settings", {
          adminUiLayouts: { [ADMIN_UI_LAYOUT_SURFACE_MAIN]: normalized },
        });
        if (res.ok) {
          qc.setQueryData(SETTINGS_KEY, await res.json());
        }
        localStorage.removeItem(adminDashboardLayoutStorageKey(userId));
      } catch {
        migratedRef.current = false;
      }
    })();
  }, [enabled, data, userId, qc]);

  const surfaces = useMemo(
    () => hydrateUnifiedLayoutsFromServer(data?.adminUiLayouts ?? null),
    [data?.adminUiLayouts],
  );

  const analyticsCustomized = useMemo(
    () => analyticsLayoutKeyPresent(data?.adminUiLayouts ?? null),
    [data?.adminUiLayouts],
  );

  const persistMutation = useMutation({
    mutationFn: async (payload: Record<string, { order: string[]; hidden: string[] } | null>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", { adminUiLayouts: payload });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save layout");
      }
      return (await res.json()) as AdminSettingsApiPayload;
    },
    onSuccess: (payload) => {
      qc.setQueryData(SETTINGS_KEY, payload);
    },
  });

  const persistFromSurfaces = useCallback(
    (next: UnifiedAdminLayoutsState, options?: { removeAnalyticsKey?: boolean }) => {
      const deduped = dedupeWidgetPlacementAcrossSurfaces(next);
      const raw = data?.adminUiLayouts;
      const patch: Record<string, { order: string[]; hidden: string[] } | null> = {
        main: deduped.main,
        crm: deduped.crm,
      };
      if (options?.removeAnalyticsKey) {
        patch.analytics = null;
      } else if (
        analyticsLayoutKeyPresent(raw) ||
        deduped.analytics.order.length > 0 ||
        deduped.analytics.hidden.length > 0
      ) {
        patch.analytics = deduped.analytics;
      }
      persistMutation.mutate(patch);
    },
    [data?.adminUiLayouts, persistMutation],
  );

  const reorderSurface = useCallback(
    (surface: UnifiedLayoutSurfaceId, order: string[]) => {
      persistFromSurfaces({ ...surfaces, [surface]: { ...surfaces[surface], order } });
    },
    [surfaces, persistFromSurfaces],
  );

  const toggleHidden = useCallback(
    (surface: UnifiedLayoutSurfaceId, id: string, hidden: boolean) => {
      const layout = surfaces[surface];
      const nextHidden = new Set(layout.hidden);
      if (hidden) nextHidden.add(id);
      else nextHidden.delete(id);
      persistFromSurfaces({
        ...surfaces,
        [surface]: { ...layout, hidden: [...nextHidden] },
      });
    },
    [surfaces, persistFromSurfaces],
  );

  const moveWidgetToSurface = useCallback(
    (widgetId: AdminWidgetId, target: UnifiedLayoutSurfaceId, targetIndex?: number) => {
      const next: UnifiedAdminLayoutsState = {
        main: { order: [...surfaces.main.order], hidden: [...surfaces.main.hidden] },
        crm: { order: [...surfaces.crm.order], hidden: [...surfaces.crm.hidden] },
        analytics: { order: [...surfaces.analytics.order], hidden: [...surfaces.analytics.hidden] },
      };
      for (const sid of UNIFIED_LAYOUT_SURFACE_IDS) {
        next[sid].order = next[sid].order.filter((x) => x !== widgetId);
        next[sid].hidden = next[sid].hidden.filter((x) => x !== widgetId);
      }
      const tgt = next[target];
      const idx = Math.min(targetIndex ?? tgt.order.length, tgt.order.length);
      tgt.order.splice(idx, 0, widgetId);
      persistFromSurfaces(dedupeWidgetPlacementAcrossSurfaces(next));
    },
    [surfaces, persistFromSurfaces],
  );

  const removeWidgetEverywhere = useCallback(
    (widgetId: AdminWidgetId) => {
      const next: UnifiedAdminLayoutsState = {
        main: {
          order: surfaces.main.order.filter((x) => x !== widgetId),
          hidden: surfaces.main.hidden.filter((x) => x !== widgetId),
        },
        crm: {
          order: surfaces.crm.order.filter((x) => x !== widgetId),
          hidden: surfaces.crm.hidden.filter((x) => x !== widgetId),
        },
        analytics: {
          order: surfaces.analytics.order.filter((x) => x !== widgetId),
          hidden: surfaces.analytics.hidden.filter((x) => x !== widgetId),
        },
      };
      persistFromSurfaces(next);
    },
    [surfaces, persistFromSurfaces],
  );

  const resetSurfaceToDefaults = useCallback(
    (surface: UnifiedLayoutSurfaceId) => {
      if (surface === "analytics") {
        persistFromSurfaces(
          { ...surfaces, analytics: { order: [], hidden: [] } },
          { removeAnalyticsKey: true },
        );
        return;
      }
      const next: UnifiedAdminLayoutsState = { ...surfaces };
      if (surface === "main") {
        next.main = { order: [...DEFAULT_ADMIN_DASHBOARD_ORDER], hidden: [] };
      } else {
        next.crm = { order: [...DEFAULT_CRM_DASHBOARD_ORDER], hidden: [] };
      }
      persistFromSurfaces(dedupeWidgetPlacementAcrossSurfaces(next));
    },
    [surfaces, persistFromSurfaces],
  );

  const restoreAnalyticsFullPage = useCallback(() => {
    persistFromSurfaces(
      { ...surfaces, analytics: { order: [], hidden: [] } },
      { removeAnalyticsKey: true },
    );
  }, [surfaces, persistFromSurfaces]);

  const visibleOrder = useCallback(
    (surface: UnifiedLayoutSurfaceId) => visibleOrderForSurface(surfaces[surface]),
    [surfaces],
  );

  const ready = !authLoading && (!enabled || (isFetched && !isLoading));

  return {
    surfaces,
    analyticsCustomized,
    ready,
    persistError: persistMutation.error,
    isPersisting: persistMutation.isPending,
    reorderSurface,
    toggleHidden,
    moveWidgetToSurface,
    removeWidgetEverywhere,
    resetSurfaceToDefaults,
    restoreAnalyticsFullPage,
    visibleOrder,
  };
}

export function useMainDashboardLayout() {
  const u = useUnifiedAdminLayouts();
  return {
    layout: u.surfaces.main,
    ready: u.ready,
    visibleSectionOrder: u.visibleOrder("main"),
    setOrder: (order: string[]) => u.reorderSurface("main", order),
    setSectionHidden: (id: string, hidden: boolean) => u.toggleHidden("main", id, hidden),
    resetToDefault: () => u.resetSurfaceToDefaults("main"),
    persistError: u.persistError,
    isPersisting: u.isPersisting,
  };
}

export function useCrmDashboardLayout() {
  const u = useUnifiedAdminLayouts();
  return {
    layout: u.surfaces.crm,
    ready: u.ready,
    visibleSectionOrder: u.visibleOrder("crm"),
    setOrder: (order: string[]) => u.reorderSurface("crm", order),
    setSectionHidden: (id: string, hidden: boolean) => u.toggleHidden("crm", id, hidden),
    resetToDefault: () => u.resetSurfaceToDefaults("crm"),
    persistError: u.persistError,
    isPersisting: u.isPersisting,
  };
}
