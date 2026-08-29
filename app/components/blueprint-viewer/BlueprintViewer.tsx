"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, ZoomIn, ZoomOut, Move, MousePointer2, Hand } from "lucide-react";
import { SymbolLibrary } from "./SymbolLibrary";
import { PlacedMarker } from "./PlacedMarker";
import type { MarkerSymbol, PlacedMarkerData } from "./types";
import { cn } from "@/lib/utils";

type Tool = "select" | "pan" | "place";

interface BlueprintViewerProps {
  blueprintUrl?: string;
  onBlueprintUpload?: (file: File) => void;
  onMarkersChange?: (markers: PlacedMarkerData[]) => void;
}

export function BlueprintViewer({
  blueprintUrl: initialBlueprintUrl,
  onBlueprintUpload,
  onMarkersChange,
}: BlueprintViewerProps) {
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(
    initialBlueprintUrl || null
  );
  const [placedMarkers, setPlacedMarkers] = useState<PlacedMarkerData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<MarkerSymbol | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setBlueprintUrl(url);
    onBlueprintUpload?.(file);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) return;

    if (activeTool === "place" && selectedSymbol && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      const newMarker: PlacedMarkerData = {
        id: `marker-${Date.now()}`,
        symbol: selectedSymbol,
        position: { x, y },
        rotation: 0,
      };

      const updated = [...placedMarkers, newMarker];
      setPlacedMarkers(updated);
      onMarkersChange?.(updated);
      setSelectedSymbol(null);
      setActiveTool("select");
    } else if (activeTool === "select") {
      setSelectedMarkerId(null);
    }
  };

  const handleMarkerUpdate = (id: string, updates: Partial<PlacedMarkerData>) => {
    const updated = placedMarkers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    setPlacedMarkers(updated);
    onMarkersChange?.(updated);
  };

  const handleMarkerDelete = (id: string) => {
    const updated = placedMarkers.filter((m) => m.id !== id);
    setPlacedMarkers(updated);
    onMarkersChange?.(updated);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  const handleMouseDown = (e: React.MouseEvent) => {
    const shouldPan =
      activeTool === "pan" ||
      e.button === 1 ||
      (e.button === 0 && e.altKey);

    if (shouldPan) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom((z) => Math.max(0.5, Math.min(3, z + delta)));
    } else {
      e.preventDefault();
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const handleSymbolSelect = (symbol: MarkerSymbol | null) => {
    setSelectedSymbol(symbol);
    if (symbol) {
      setActiveTool("place");
    } else {
      setActiveTool("select");
    }
  };

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
    if (tool !== "place") {
      setSelectedSymbol(null);
    }
    if (tool !== "select") {
      setSelectedMarkerId(null);
    }
  };

  const getCursor = () => {
    if (isPanning) return "grabbing";
    if (activeTool === "pan") return "grab";
    if (activeTool === "place" && selectedSymbol) return "crosshair";
    return "default";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
      <SymbolLibrary
        selectedSymbol={selectedSymbol}
        onSymbolSelect={handleSymbolSelect}
      />

      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Blueprint Viewer</CardTitle>
            <div className="flex gap-2">
              {!blueprintUrl && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Blueprint
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 py-1">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {blueprintUrl && (
            <div className="flex gap-2 mt-4">
              <Button
                variant={activeTool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("select")}
                className={cn(
                  "flex items-center gap-2",
                  activeTool === "select" && "ring-2 ring-offset-2"
                )}
              >
                <MousePointer2 className="h-4 w-4" />
                Select
              </Button>
              <Button
                variant={activeTool === "pan" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("pan")}
                className={cn(
                  "flex items-center gap-2",
                  activeTool === "pan" && "ring-2 ring-offset-2"
                )}
              >
                <Hand className="h-4 w-4" />
                Grab
              </Button>
            </div>
          )}

          {activeTool === "place" && selectedSymbol && (
            <p className="text-sm text-muted-foreground mt-2">
              Click on the blueprint to place: <strong>{selectedSymbol.name}</strong>
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0 relative overflow-hidden">
          {!blueprintUrl ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted/20">
              <Upload className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Upload a blueprint image to start placing markers
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Blueprint
              </Button>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="w-full h-full relative bg-slate-100 dark:bg-slate-900"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                cursor: getCursor(),
              }}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "0 0",
                  transition: isPanning ? "none" : "transform 0.1s",
                }}
              >
                <img
                  src={blueprintUrl}
                  alt="Blueprint"
                  className="max-w-none"
                  draggable={false}
                />

                {placedMarkers.map((marker) => (
                  <PlacedMarker
                    key={marker.id}
                    marker={marker}
                    zoom={zoom}
                    isInteractive={activeTool === "select"}
                    onUpdate={(updates) => handleMarkerUpdate(marker.id, updates)}
                    onDelete={() => handleMarkerDelete(marker.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
