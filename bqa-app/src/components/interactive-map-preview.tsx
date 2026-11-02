"use client";

import React, { useState, useRef } from "react";
import { MapPin, ZoomIn, ZoomOut, Compass, Layers } from "lucide-react";

interface InteractiveMapPreviewProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
}

export function InteractiveMapPreview({
  latitude,
  longitude,
  radiusMeters,
  onLocationChange,
}: InteractiveMapPreviewProps) {
  const [zoom, setZoom] = useState<number>(17);
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert lat/lng to tile coordinates
  const latLngToTile = (lat: number, lng: number, zoomLevel: number) => {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoomLevel);
    const xtile = ((lng + 180) / 360) * n;
    const ytile =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    return { x: xtile, y: ytile };
  };

  // Convert tile coordinates back to lat/lng
  const tileToLatLng = (x: number, y: number, zoomLevel: number) => {
    const n = Math.pow(2, zoomLevel);
    const lng = (x / n) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
    const lat = (latRad * 180) / Math.PI;
    return { lat, lng };
  };

  // Calculate pixel radius on screen corresponding to radiusMeters at current latitude and zoom
  const calculatePixelRadius = (radiusM: number, lat: number, zoomLevel: number) => {
    const latRad = (lat * Math.PI) / 180;
    const metersPerPixel =
      (156543.03392 * Math.cos(latRad)) / Math.pow(2, zoomLevel);
    return Math.max(10, radiusM / metersPerPixel);
  };

  const pixelRadius = calculatePixelRadius(radiusMeters, latitude, zoom);

  // Handle map click to re-center location
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = clickX - centerX;
    const deltaY = clickY - centerY;

    const centerTile = latLngToTile(latitude, longitude, zoom);
    const tileSize = 256;
    const newTileX = centerTile.x + deltaX / tileSize;
    const newTileY = centerTile.y + deltaY / tileSize;

    const newCoords = tileToLatLng(newTileX, newTileY, zoom);
    onLocationChange(
      parseFloat(newCoords.lat.toFixed(7)),
      parseFloat(newCoords.lng.toFixed(7))
    );
  };

  const centerTile = latLngToTile(latitude, longitude, zoom);
  const tileX = Math.floor(centerTile.x);
  const tileY = Math.floor(centerTile.y);
  const offsetX = (centerTile.x - tileX) * 256;
  const offsetY = (centerTile.y - tileY) * 256;

  // Generate 3x3 tile grid around center tile
  const tiles = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tx = tileX + dx;
      const ty = tileY + dy;
      const tileUrl =
        mapMode === "satellite"
          ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`
          : `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;

      tiles.push({
        key: `${tx}-${ty}-${zoom}-${mapMode}`,
        url: tileUrl,
        left: (dx + 1) * 256 - offsetX + 128,
        top: (dy + 1) * 256 - offsetY + 128,
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Compass className="size-3.5 text-primary" />
          <span>Visualisasi Peta Radius Pesantren</span>
        </span>
        <span className="text-[11px] text-muted-foreground">
          Klik pada peta untuk menggeser titik pusat
        </span>
      </div>

      <div
        ref={containerRef}
        onClick={handleMapClick}
        className="group relative h-72 w-full cursor-crosshair select-none overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-inner"
      >
        {/* Map Tile Layer */}
        <div className="pointer-events-none absolute inset-0 size-full">
          {tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt="Map Tile"
              className="absolute size-64 object-cover opacity-90 transition-opacity duration-200"
              style={{
                left: `calc(50% + ${tile.left - 256}px)`,
                top: `calc(50% + ${tile.top - 256}px)`,
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.backgroundColor = "#1e293b";
              }}
            />
          ))}
        </div>

        {/* Contrast Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-slate-950/10" />

        {/* Radius Circle Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full border-2 border-emerald-500/80 bg-emerald-500/20 backdrop-blur-[1px] transition-all duration-300 animate-pulse"
            style={{
              width: `${pixelRadius * 2}px`,
              height: `${pixelRadius * 2}px`,
            }}
          >
            <div className="size-full rounded-full border border-dashed border-emerald-400/60" />
          </div>
        </div>

        {/* Center Marker Pin */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="relative flex -translate-y-1/2 flex-col items-center">
            <div className="rounded-full border-2 border-white bg-primary p-2 text-white shadow-lg ring-4 ring-primary/30">
              <MapPin className="size-5 fill-white text-primary" />
            </div>
            <div className="mt-1 whitespace-nowrap rounded-full border border-slate-700/80 bg-slate-900/90 px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-white shadow-md backdrop-blur-xs">
              Pusat ({radiusMeters}m)
            </div>
          </div>
        </div>

        {/* Controls Overlay (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(19, z + 1));
            }}
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md transition-colors hover:bg-muted"
            title="Perbesar Peta"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(14, z - 1));
            }}
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md transition-colors hover:bg-muted"
            title="Perkecil Peta"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMapMode((m) => (m === "street" ? "satellite" : "street"));
            }}
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md transition-colors hover:bg-muted"
            title="Ganti Mode Peta (Jalan / Satelit)"
          >
            <Layers className="size-3.5" />
          </button>
        </div>

        {/* Coordinate Display Overlay (Bottom Left) */}
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/85 px-2.5 py-1 font-mono text-[10px] text-white shadow-md backdrop-blur-md">
          <span>Lat: {latitude}</span>
          <span>•</span>
          <span>Lng: {longitude}</span>
          <span className="font-semibold text-emerald-400">• R: {radiusMeters}m</span>
        </div>
      </div>
    </div>
  );
}
