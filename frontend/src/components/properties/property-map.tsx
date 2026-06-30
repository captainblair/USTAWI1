"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import L from "leaflet";
import { MapPin, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  DEFAULT_ZOOM,
  NAIROBI_CENTER,
  formatBbox,
  parseBbox,
  parseCenter,
} from "@/lib/geo";
import type { PropertyListItem } from "@/types/property";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

type SearchMode = "bbox" | "radius";

function createPinIcon(active = false) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:flex;height:28px;width:28px;align-items:center;justify-content:center;
      border-radius:9999px;border:2px solid white;
      background:${active ? "#ef3d32" : "#1f2b6c"};
      box-shadow:0 4px 12px rgba(31,43,108,0.25);
      font-size:11px;font-weight:700;color:white;
    ">U</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

type PropertyMapProps = {
  properties: PropertyListItem[];
  className?: string;
};

export function PropertyMap({ properties, className }: PropertyMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<SearchMode>(
    searchParams.get("lat") && searchParams.get("radius") ? "radius" : "bbox",
  );
  const [radiusKm, setRadiusKm] = useState(
    Math.min(20, Math.max(1, parseFloat(searchParams.get("radius") ?? "5") || 5)),
  );
  const [mapReady, setMapReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);

  const pushGeoParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      startTransition(() => router.push(`/properties?${params.toString()}`));
    },
    [router, searchParams, startTransition],
  );

  const applyBboxFromMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    pushGeoParams({
      bbox: formatBbox(sw.lng, sw.lat, ne.lng, ne.lat),
      lat: null,
      lng: null,
      radius: null,
    });
  }, [pushGeoParams]);

  const applyRadiusSearch = useCallback(
    (center: { lat: number; lng: number }, km: number) => {
      pushGeoParams({
        lat: center.lat.toFixed(6),
        lng: center.lng.toFixed(6),
        radius: String(km),
        bbox: null,
      });
    },
    [pushGeoParams],
  );

  const clearGeoSearch = useCallback(() => {
    pushGeoParams({ bbox: null, lat: null, lng: null, radius: null });
  }, [pushGeoParams]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([NAIROBI_CENTER.lat, NAIROBI_CENTER.lng], DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    overlayLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      overlayLayerRef.current = null;
      centerMarkerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Radius: map click sets centre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== "radius") return;

    const onClick = (e: L.LeafletMouseEvent) => {
      applyRadiusSearch(e.latlng, radiusKm);
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [mode, radiusKm, applyRadiusSearch]);

  // Draw markers + overlays when properties or URL geo params change
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!mapReady || !map || !markersLayer || !overlayLayer) return;

    markersLayer.clearLayers();
    overlayLayer.clearLayers();
    centerMarkerRef.current = null;

    const mappable = properties.filter(
      (p) => p.latitude != null && p.longitude != null && !Number.isNaN(Number(p.latitude)),
    );

    mappable.forEach((property) => {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      const marker = L.marker([lat, lng], { icon: createPinIcon() });
      marker.bindPopup(
        `<div style="min-width:160px;font-family:system-ui,sans-serif">
          <strong style="color:#1f2b6c;font-size:13px">${property.title}</strong>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280">${property.city}${property.neighborhood ? ` · ${property.neighborhood.name}` : ""}</p>
          <p style="margin:6px 0 0;font-size:13px;font-weight:600;color:#ef3d32">${formatPrice(property.price_monthly)}/mo</p>
          <a href="/properties/${property.slug}" style="display:inline-block;margin-top:8px;font-size:12px;color:#1f2b6c;font-weight:600">View listing →</a>
        </div>`,
      );
      marker.addTo(markersLayer);
    });

    const bbox = searchParams.get("bbox");
    const parsedBbox = bbox ? parseBbox(bbox) : null;
    if (parsedBbox && mode === "bbox") {
      const [minLng, minLat, maxLng, maxLat] = parsedBbox;
      L.rectangle(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { color: "#ef3d32", weight: 2, fillOpacity: 0.06 },
      ).addTo(overlayLayer);
      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { padding: [24, 24], maxZoom: 15 },
      );
    } else {
      const center = parseCenter(searchParams.get("lat"), searchParams.get("lng"));
      const radius = parseFloat(searchParams.get("radius") ?? "");
      if (center && !Number.isNaN(radius) && mode === "radius") {
        L.circle([center.lat, center.lng], {
          radius: radius * 1000,
          color: "#ef3d32",
          weight: 2,
          fillOpacity: 0.08,
        }).addTo(overlayLayer);
        centerMarkerRef.current = L.marker([center.lat, center.lng], {
          icon: createPinIcon(true),
          draggable: true,
        })
          .addTo(overlayLayer)
          .on("dragend", (e) => {
            const pos = e.target.getLatLng();
            applyRadiusSearch(pos, radiusKm);
          });
        map.setView([center.lat, center.lng], Math.max(map.getZoom(), 13));
      } else if (mappable.length > 0) {
        const bounds = L.latLngBounds(mappable.map((p) => [Number(p.latitude), Number(p.longitude)]));
        map.fitBounds(bounds.pad(0.15), { maxZoom: 14 });
      }
    }
  }, [properties, searchParams, mode, radiusKm, applyRadiusSearch, mapReady]);

  const mappableCount = properties.filter(
    (p) => p.latitude != null && p.longitude != null && !Number.isNaN(Number(p.latitude)),
  ).length;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ustawi-border bg-white shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ustawi-border/70 px-4 py-3">
        <div className="flex rounded-lg border border-ustawi-border p-0.5">
          <button
            type="button"
            onClick={() => setMode("bbox")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              mode === "bbox" ? "bg-ustawi-navy text-white" : "text-ustawi-muted hover:text-ustawi-navy",
            )}
          >
            Map area
          </button>
          <button
            type="button"
            onClick={() => setMode("radius")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              mode === "radius" ? "bg-ustawi-navy text-white" : "text-ustawi-muted hover:text-ustawi-navy",
            )}
          >
            Radius
          </button>
        </div>

        {mode === "bbox" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={applyBboxFromMap}
              disabled={isPending}
            >
              Search this area
            </Button>
            {searchParams.get("bbox") && (
              <Button type="button" size="sm" variant="outline" onClick={clearGeoSearch} disabled={isPending}>
                Clear map
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-ustawi-muted">
              <Radar className="h-3.5 w-3.5" />
              {radiusKm} km
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={radiusKm}
                onChange={(e) => {
                  const km = Number(e.target.value);
                  setRadiusKm(km);
                  const center =
                    parseCenter(searchParams.get("lat"), searchParams.get("lng")) ?? NAIROBI_CENTER;
                  applyRadiusSearch(center, km);
                }}
                className="w-24 accent-ustawi-red"
              />
            </label>
            <span className="hidden text-xs text-ustawi-muted sm:inline">
              <MapPin className="mr-1 inline h-3 w-3" />
              Click map to set centre
            </span>
            {(searchParams.get("lat") || searchParams.get("radius")) && (
              <Button type="button" size="sm" variant="outline" onClick={clearGeoSearch} disabled={isPending}>
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
        <div ref={containerRef} className="absolute inset-0 z-0" />
        {mapReady && mappableCount === 0 && (
          <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-lg border border-ustawi-border bg-white/95 px-3 py-2 text-center text-xs text-ustawi-muted shadow-sm">
            {properties.length === 0
              ? "No listings loaded — start the Django API (port 8001) and run seed_properties."
              : "Listings loaded but none have map coordinates yet."}
          </div>
        )}
        {mapReady && mappableCount > 0 && (
          <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-full bg-ustawi-navy px-3 py-1 text-xs font-semibold text-white shadow-md">
            {mappableCount} {mappableCount === 1 ? "home" : "homes"} on map
          </div>
        )}
      </div>
      <p className="border-t border-ustawi-border/60 px-4 py-2 text-[11px] text-ustawi-muted">
        {mode === "bbox"
          ? "Pan and zoom, then click Search this area — results below update from the API."
          : "Switch to Radius, click the map, then drag the pin or adjust km — results filter live."}
      </p>
    </div>
  );
}
