"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutGrid, RotateCcw, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUnifiedAdminLayouts } from "@/hooks/useAdminUiLayouts";
import {
  ALL_ADMIN_WIDGET_IDS,
  ADMIN_WIDGET_LABELS,
  type UnifiedLayoutSurfaceId,
  type AdminWidgetId,
} from "@/lib/adminWidgetCatalog";

const SURFACE_TABS: { id: UnifiedLayoutSurfaceId; label: string; short: string }[] = [
  { id: "main", label: "Main dashboard", short: "Main" },
  { id: "crm", label: "CRM overview", short: "CRM" },
  { id: "analytics", label: "Analytics page", short: "Analytics" },
];

function SortableRow({
  id,
  label,
  visible,
  onVisibleChange,
  currentSurface,
  onMoveTo,
}: {
  id: string;
  label: string;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
  currentSurface: UnifiedLayoutSurfaceId;
  onMoveTo: (target: UnifiedLayoutSurfaceId) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const switchId = useId();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border/80 bg-card p-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-2",
        isDragging && "z-10 opacity-90 ring-2 ring-primary/30",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          className={cn(
            "cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted",
            "active:cursor-grabbing min-h-[44px] min-w-[44px] shrink-0 sm:min-h-0 sm:min-w-0",
          )}
          aria-label={`Drag to reorder: ${label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{label}</span>
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <Label htmlFor={switchId} className="sr-only">
            Show {label}
          </Label>
          <Switch id={switchId} checked={visible} onCheckedChange={onVisibleChange} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <div className="hidden items-center gap-2 sm:flex">
          <Label htmlFor={`${switchId}-desk`} className="sr-only">
            Show {label}
          </Label>
          <Switch id={`${switchId}-desk`} checked={visible} onCheckedChange={onVisibleChange} />
        </div>
        <Select
          value={currentSurface}
          onValueChange={(v) => {
            if (v === currentSurface) return;
            if (v === "main" || v === "crm" || v === "analytics") onMoveTo(v);
          }}
        >
          <SelectTrigger className="h-11 w-full min-w-[8.5rem] touch-manipulation sm:h-9 sm:w-[9.5rem]" aria-label="Move module to page">
            <SelectValue placeholder="Move to…" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[min(70vh,320px)]">
            {SURFACE_TABS.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export interface AdminUnifiedLayoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which tab to select when the sheet opens */
  initialSurface?: UnifiedLayoutSurfaceId;
}

export function AdminUnifiedLayoutSheet({
  open,
  onOpenChange,
  initialSurface = "main",
}: AdminUnifiedLayoutSheetProps) {
  const [tab, setTab] = useState<UnifiedLayoutSurfaceId>(initialSurface);
  const layout = useUnifiedAdminLayouts();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const unassigned = useMemo(() => {
    const placed = new Set<string>();
    for (const sid of SURFACE_TABS) {
      for (const id of layout.surfaces[sid.id].order) placed.add(id);
    }
    return ALL_ADMIN_WIDGET_IDS.filter((id) => !placed.has(id));
  }, [layout.surfaces]);

  const onDragEnd = useCallback(
    (surface: UnifiedLayoutSurfaceId, order: string[]) =>
      (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = order.indexOf(String(active.id));
        const newIndex = order.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        layout.reorderSurface(surface, arrayMove(order, oldIndex, newIndex));
      },
    [layout],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(100vw-1rem,24rem)] sm:w-full sm:max-w-md flex flex-col p-4 sm:p-6 gap-0"
      >
        <SheetHeader className="space-y-1 pr-8 text-left shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden />
            Customize admin pages
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm leading-relaxed">
            Drag to reorder modules on each page. Use <span className="font-medium text-foreground">Move to</span>{" "}
            to place a block on another dashboard. Each module can only appear on one page at a time. Layout syncs to
            your account.
          </SheetDescription>
        </SheetHeader>

        {layout.persistError ? (
          <p className="text-xs text-destructive mt-2 shrink-0">
            {(layout.persistError as Error).message || "Could not save layout."}
          </p>
        ) : null}

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as UnifiedLayoutSurfaceId)}
          className="mt-4 flex min-h-0 flex-1 flex-col gap-3"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
            {SURFACE_TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="min-h-[44px] px-2 text-xs sm:text-sm touch-manipulation"
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SURFACE_TABS.map((surfaceTab) => (
            <TabsContent
              key={surfaceTab.id}
              value={surfaceTab.id}
              className="mt-0 flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden"
            >
              {surfaceTab.id === "analytics" ? (
                <div className="rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {layout.analyticsCustomized ? (
                    <>
                      This page uses your custom modules. To restore the full analytics experience (all tabs), use{" "}
                      <span className="font-medium text-foreground">Full analytics page</span> below.
                    </>
                  ) : (
                    <>
                      The analytics URL still shows the full report by default. Add modules here to build a compact
                      analytics dashboard, or place analytics summaries on Main / CRM.
                    </>
                  )}
                </div>
              ) : null}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd(surfaceTab.id, layout.surfaces[surfaceTab.id].order)}
              >
                <SortableContext
                  items={layout.surfaces[surfaceTab.id].order}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="max-h-[min(50vh,340px)] space-y-2 overflow-y-auto overscroll-contain pr-0.5 flex-1 min-h-0">
                    {layout.surfaces[surfaceTab.id].order.map((id) => (
                      <li key={id}>
                        <SortableRow
                          id={id}
                          label={ADMIN_WIDGET_LABELS[id as AdminWidgetId] ?? id}
                          visible={!layout.surfaces[surfaceTab.id].hidden.includes(id)}
                          onVisibleChange={(v) => layout.toggleHidden(surfaceTab.id, id, !v)}
                          currentSurface={surfaceTab.id}
                          onMoveTo={(target) => layout.moveWidgetToSurface(id as AdminWidgetId, target)}
                        />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>

              {unassigned.length > 0 ? (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 shrink-0">
                  <p className="text-xs font-medium text-foreground mb-2">Available to add</p>
                  <ul className="space-y-2 max-h-[28vh] overflow-y-auto">
                    {unassigned.map((id) => (
                      <li
                        key={id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border/50 bg-card/80 px-2 py-2"
                      >
                        <span className="text-sm">{ADMIN_WIDGET_LABELS[id]}</span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="min-h-[44px] sm:min-h-9 w-full sm:w-auto shrink-0 gap-1"
                          disabled={layout.isPersisting}
                          onClick={() => layout.moveWidgetToSurface(id, surfaceTab.id)}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add here
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 pt-1 border-t border-border/60 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full min-h-[44px] sm:min-h-9 justify-center gap-2 text-muted-foreground"
                  disabled={layout.isPersisting}
                  onClick={() => layout.resetSurfaceToDefaults(surfaceTab.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset {surfaceTab.short} defaults
                </Button>
                {surfaceTab.id === "analytics" && layout.analyticsCustomized ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[44px] sm:min-h-9"
                    disabled={layout.isPersisting}
                    onClick={() => layout.restoreAnalyticsFullPage()}
                  >
                    Full analytics page (all tabs)
                  </Button>
                ) : null}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export function AdminUnifiedLayoutSheetTrigger({
  initialSurface = "main",
  label,
  shortLabel,
  mobileLabel,
  className,
}: {
  initialSurface?: UnifiedLayoutSurfaceId;
  /** Desktop + screen reader label (default: Customize pages) */
  label?: string;
  /** Narrow screens (default: Pages). Preferred over `mobileLabel`. */
  shortLabel?: string;
  /** @deprecated Use `shortLabel` */
  mobileLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const layout = useUnifiedAdminLayouts();
  if (!layout.ready) return null;
  const desktopLabel = label ?? "Customize pages";
  const compactLabel = shortLabel ?? mobileLabel ?? "Pages";
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("gap-2 shrink-0 min-h-[44px] sm:min-h-9", className)}
        onClick={() => setOpen(true)}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{desktopLabel}</span>
        <span className="sm:hidden">{compactLabel}</span>
      </Button>
      <AdminUnifiedLayoutSheet open={open} onOpenChange={setOpen} initialSurface={initialSurface} />
    </>
  );
}
