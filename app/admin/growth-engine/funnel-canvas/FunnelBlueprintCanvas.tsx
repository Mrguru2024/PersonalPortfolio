"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FlowNode = { id: string; type: string; label: string; path?: string };

type FlowEdge = { id: string; source: string; target: string };

function linearEdges(nodes: FlowNode[]): FlowEdge[] {
  const edges: FlowEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ id: `e-${nodes[i]!.id}-${nodes[i + 1]!.id}`, source: nodes[i]!.id, target: nodes[i + 1]!.id });
  }
  return edges;
}

function SortableRow({
  node,
  onChange,
}: {
  node: FlowNode;
  onChange: (n: FlowNode) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <Card ref={setNodeRef} style={style} className={cn("mb-2", isDragging ? "opacity-60" : "")}>
      <CardContent className="py-3 flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className="touch-none text-muted-foreground hover:text-foreground p-1"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono uppercase w-16 shrink-0 text-muted-foreground">{node.type}</span>
        <Input
          className="h-8 max-w-[200px]"
          value={node.label}
          onChange={(e) => onChange({ ...node, label: e.target.value })}
        />
        <Input
          className="h-8 flex-1 min-w-[120px]"
          placeholder="Path (optional)"
          value={node.path ?? ""}
          onChange={(e) => onChange({ ...node, path: e.target.value || undefined })}
        />
      </CardContent>
    </Card>
  );
}

export function FunnelBlueprintCanvas() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nodes, setNodes] = useState<FlowNode[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/growth-engine/funnel-blueprint"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/growth-engine/funnel-blueprint?key=startup");
      return res.json() as Promise<{ blueprint: { nodesJson: unknown[]; edgesJson: unknown[]; key: string } }>;
    },
    enabled: !!user?.isAdmin,
  });

  useEffect(() => {
    const raw = data?.blueprint?.nodesJson;
    if (!raw || !Array.isArray(raw)) return;
    const parsed = raw.filter((x): x is FlowNode => typeof x === "object" && x != null && "id" in x) as FlowNode[];
    if (parsed.length > 0) setNodes(parsed);
  }, [data?.blueprint?.nodesJson]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const edges = useMemo(() => linearEdges(nodes), [nodes]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/admin/growth-engine/funnel-blueprint?key=startup", {
        nodesJson: nodes,
        edgesJson: edges,
      });
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["/api/admin/growth-engine/funnel-blueprint"] });
      toast({ title: "Blueprint saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = nodes.findIndex((n) => n.id === active.id);
    const newIndex = nodes.findIndex((n) => n.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setNodes(arrayMove(nodes, oldIndex, newIndex));
  }

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funnel canvas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag steps to reorder. Saves to <code className="bg-muted px-1 rounded">growth_funnel_blueprints</code> — live
            metrics overlay can join behavior rollups in a follow-up.
          </p>
        </div>
        <Button type="button" onClick={() => saveMut.mutate()} disabled={saveMut.isPending || nodes.length < 1}>
          {saveMut.isPending ?
            <Loader2 className="h-4 w-4 animate-spin" />
          : <>
              <Save className="h-4 w-4 mr-1" /> Save order
            </>
          }
        </Button>
      </div>

      {isLoading ?
        <Loader2 className="h-6 w-6 animate-spin" />
      : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
            {nodes.map((node, i) => (
              <div key={node.id}>
                <SortableRow node={node} onChange={(n) => setNodes((prev) => prev.map((x) => (x.id === n.id ? n : x)))} />
                {i < nodes.length - 1 ?
                  <p className="text-center text-xs text-muted-foreground py-1">↓</p>
                : null}
              </div>
            ))}
          </SortableContext>
        </DndContext>
      }
    </div>
  );
}
