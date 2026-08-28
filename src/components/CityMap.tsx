"use client";

import { Map as MapLibreMap, NavigationControl, config } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

import cityBoundary from "@/data/city-boundary.json";

// The bundler's own module-worker URL resolution for maplibre-gl comes back
// empty in this project (Next.js + Turbopack/webpack), so GeoJSON/vector
// sources never tile and silently never render. Point at a static copy of
// the worker instead of the auto-detected one. Keep public/maplibre/ in
// sync with node_modules/maplibre-gl/dist/ on every maplibre-gl upgrade.
config.WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

// Centroid of the SJDM boundary polygon (see docs/HANDOFF.md §3b — the
// boundary anchors the map, it does not fence it).
const SJDM_CENTER: [number, number] = [121.0474088, 14.8101978];
const INITIAL_ZOOM = 12;

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
    },
  ],
};

export function CityMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: SJDM_CENTER,
      zoom: INITIAL_ZOOM,
    });

    map.addControl(new NavigationControl(), "top-right");

    let cancelled = false;

    map.on("load", () => {
      // React Strict Mode in dev mounts/unmounts/remounts this effect; skip
      // if this map instance was already torn down before "load" fired.
      if (cancelled) return;

      map.addSource("city-boundary", {
        type: "geojson",
        data: cityBoundary as GeoJSON.FeatureCollection,
      });

      // Anchor layer, not a mask — see docs/HANDOFF.md §3b. Outline only.
      map.addLayer({
        id: "city-boundary-line",
        type: "line",
        source: "city-boundary",
        paint: {
          "line-color": "#2563eb",
          "line-width": 2,
        },
      });
    });

    mapRef.current = map;

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
