"use client";

import * as React from "react";

interface MapPreviewProps {
  latitude: number | string;
  longitude: number | string;
  className?: string;
  label?: string;
  zoom?: number;
}

// Lightweight map preview using OpenStreetMap embed (no API key required).
// Provides an accessible fallback if iframe fails to load.
export function MapPreview({ latitude, longitude, className, label = "Indexer location", zoom = 10 }: MapPreviewProps) {
  const latNum = React.useMemo(() => {
    if (typeof latitude === "number") return latitude;
    const n = Number(latitude);
    return Number.isFinite(n) ? n : null;
  }, [latitude]);
  const lonNum = React.useMemo(() => {
    if (typeof longitude === "number") return longitude;
    const n = Number(longitude);
    return Number.isFinite(n) ? n : null;
  }, [longitude]);

  const z = Math.min(19, Math.max(1, zoom));

  const src = React.useMemo(() => {
    if (latNum == null || lonNum == null) return null;
    // Derive bbox from "zoom" similar to Web Mercator scale.
    // Degrees per tile at equator ≈ 360 / 2^zoom. We take half a tile span as padding.
    // This yields large area for low zoom (zoomed out) and small for high zoom.
    const degPerTile = 360 / 2 ** z;
    const pad = Math.min(45, Math.max(0.0005, degPerTile / 2));
    const left = (lonNum - pad).toFixed(6);
    const right = (lonNum + pad).toFixed(6);
    const top = (latNum + pad).toFixed(6);
    const bottom = (latNum - pad).toFixed(6);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latNum.toFixed(6)}%2C${lonNum.toFixed(6)}`;
  }, [latNum, lonNum, z]);

  const externalUrl = React.useMemo(() => {
    if (latNum == null || lonNum == null) return undefined;
    return `https://www.openstreetmap.org/?mlat=${latNum.toFixed(6)}&mlon=${lonNum.toFixed(6)}#map=${z}/${latNum.toFixed(6)}/${lonNum.toFixed(6)}`;
  }, [latNum, lonNum, z]);

  if (latNum == null || lonNum == null) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground ${className || ""}`}
      >
        Invalid location
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border bg-muted ${className || ""}`} data-zoom={z}>
      {src && (
        <iframe
          title={label}
          src={src}
          loading="lazy"
          className="w-full h-full absolute inset-0"
          referrerPolicy="no-referrer"
          aria-label={label}
        />
      )}
      <div className="pointer-events-none select-none opacity-0">{label}</div>
      <div className="absolute bottom-1 right-1">
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-1 py-0.5 rounded bg-background/80 backdrop-blur border hover:underline"
          >
            Open map
          </a>
        )}
      </div>
    </div>
  );
}
