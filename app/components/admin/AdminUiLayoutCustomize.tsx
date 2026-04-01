"use client";

import { useCallback, useId, useMemo } from "react";
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
import { GripVertical, LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface AdminUiLayoutCustomizeProps {
  order: string[];
  hiddenIds: string[];
  labels: Record<string, string>;
  onReorder: (next: string[]) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onReset: () => void;
  panelTitle?: string;
  /** Shown under title — mention server sync for cross-device */
  panelDescription?: string;
}

function SortableRow({
  id,
  label,
  visible,
  onVisibleChange,
}: {
  id: string;
  label: string;
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
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
        "flex items-center gap-2 rounded-lg border border-border/80 bg-card px-2 py-2 shadow-sm",
        isDragging && "z-10 opacity-90 ring-2 ring-primary/30",
      )}
    >
      <button
        type="button"
        className={cn(
          "cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted",
          "active:cursor-grabbing min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1.5",
        )}
        aria-label={`Drag to reorder: ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <Label htmlFor={switchId} className="sr-only">
          Show {label}
        </Label>
        <Switch id={switchId} checked={visible} onCheckedChange={onVisibleChange} />
      </div>
    </div>
  );
}

export function AdminUiLayoutCustomize({
  order,
  hiddenIds,
  labels,
  onReorder,
  onToggleHidden,
  onReset,
  panelTitle = "Dashboard layout",
  panelDescription = "Drag to reorder modules. Toggle visibility off to hide a section. Layout is saved to your account and syncs across devices.",
}: AdminUiLayoutCustomizeProps) {
  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = order.indexOf(String(active.id));
      const newIndex = order.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      onReorder(arrayMove(order, oldIndex, newIndex));
    },
    [order, onReorder],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2 shrink-0 min-h-[44px] sm:min-h-9">
          <LayoutGrid className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Customize</span>
          <span className="sm:hidden">Layout</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-1.5rem,22rem)] p-4 touch-manipulation" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{panelTitle}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{panelDescription}</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2 max-h-[min(60vh,380px)] overflow-y-auto overscroll-contain pr-1">
                {order.map((id) => (
                  <li key={id}>
                    <SortableRow
                      id={id}
                      label={labels[id] ?? id}
                      visible={!hiddenSet.has(id)}
                      onVisibleChange={(v) => onToggleHidden(id, !v)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <Button type="button" variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Reset to default layout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
