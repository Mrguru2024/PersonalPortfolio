"use client";

import { useState } from "react";
import { BlueprintViewer } from "@/components/blueprint-viewer";
import type { PlacedMarkerData } from "@/components/blueprint-viewer";

export default function BlueprintViewerDemo() {
  const [markers, setMarkers] = useState<PlacedMarkerData[]>([]);

  const handleMarkersChange = (updatedMarkers: PlacedMarkerData[]) => {
    setMarkers(updatedMarkers);
    console.log("Markers updated:", updatedMarkers);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-[1800px]">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Blueprint Viewer with Device Markers</h1>
          <p className="text-muted-foreground mt-2">
            Upload a blueprint image, select symbols from the library, and click on the blueprint to place markers.
            Click markers to see details and edit. Drag markers to reposition them.
          </p>
          {markers.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {markers.length} marker{markers.length !== 1 ? "s" : ""} placed
            </p>
          )}
        </div>

        <BlueprintViewer onMarkersChange={handleMarkersChange} />
      </div>
    </div>
  );
}
