"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export function PropertyMiniMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }).setView([latitude, longitude], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<span style="display:flex;height:24px;width:24px;align-items:center;justify-content:center;border-radius:9999px;border:2px solid white;background:#ef3d32;box-shadow:0 2px 8px rgba(0,0,0,0.2);"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([latitude, longitude], { icon, title }).addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, title]);

  return <div ref={containerRef} className="h-[140px] w-full sm:h-[160px]" aria-label={`Map showing ${title}`} />;
}
