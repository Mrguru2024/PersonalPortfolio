"use client";

import { useCallback, useId, useMemo, type ReactNode } from "react";
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
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { mergeVisibleReorderIntoFullOrder } from "@/lib/adminUiLayoutsUnify";

function SortableSectionShell({
  id,
  reorderMode,
  label,
  children,
}: {
  id: string;
  reorderMode: boolean;
  label: string;
  children: ReactNode;
}) {
  const gripId = useId();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !reorderMode,
  });
  const style = reorderMode
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`admin-widget-${id}`}
      className={cn(
        "w-full min-w-0",
        reorderMode && "rounded-xl border border-dashed border-transparent",
        reorderMode && isDragging && "z-10 border-primary/35 bg-muted/20 opacity-95 shadow-md",
      )}
    >
      {reorderMode ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            className={cn(
              "cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted",
              "active:cursor-grabbing min-h-[40px] min-w-[40px] shrink-0",
            )}
            aria-labelledby={gripId}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <span id={gripId} className="font-medium text-foreground">
            {label}
          </span>
          <span className="hidden sm:inline truncate">— drag to reorder</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export interface MainDashboardDraggableSectionsProps {
  reorderMode: boolean;
  visibleIds: string[];
  fullOrder: string[];
  hidden: string[];
  sectionLabels: Record<string, string>;
  onCommitFullOrder: (order: string[]) => void;
  renderSection: (id: string) => ReactNode;
}

export function MainDashboardDraggableSections({
  reorderMode,
  visibleIds,
  fullOrder,
  hidden,
  sectionLabels,
  onCommitFullOrder,
  renderSection,
}: MainDashboardDraggableSectionsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = useMemo(() => visibleIds, [visibleIds]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!reorderMode || !over || active.id === over.id) return;
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const nextVisible = arrayMove(items, oldIndex, newIndex);
      onCommitFullOrder(mergeVisibleReorderIntoFullOrder(fullOrder, hidden, nextVisible));
    },
    [reorderMode, items, fullOrder, hidden, onCommitFullOrder],
  );

  const list = (
    <div className="flex flex-col w-full min-w-0 gap-0">
      {visibleIds.map((id) => (
        <SortableSectionShell
          key={id}
          id={id}
          reorderMode={reorderMode}
          label={sectionLabels[id] ?? id}
        >
          {renderSection(id)}
        </SortableSectionShell>
      ))}
    </div>
  );

  if (!reorderMode) {
    return list;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
    </DndContext>
  );
}
