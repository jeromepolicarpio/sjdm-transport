"use client";

import { Map as MapLibreMap, NavigationControl, addProtocol, config } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol as PMTilesProtocol } from "pmtiles";
import { useEffect, useRef } from "react";

import { BundledPMTilesSource } from "@/lib/bundled-pmtiles-source";
import cityBoundary from "@/data/city-boundary.json";
import { LocateControl } from "@/lib/locate-control";
import { OFFLINE_STYLE, OFFLINE_PMTILES_URL } from "@/lib/offline-style";
import { useNetworkStatus } from "@/lib/use-network-status";

// The bundler's own module-worker URL resolution for maplibre-gl comes back
// empty in this project (Next.js + Turbopack/webpack), so GeoJSON/vector
// sources never tile and silently never render. Point at a static copy of
// the worker instead of the auto-detected one. Keep public/maplibre/ in
// sync with node_modules/maplibre-gl/dist/ on every maplibre-gl upgrade.
config.WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

// Must be registered once globally before any style references a
// pmtiles:// source (see OFFLINE_STYLE). Pre-registers the bundled archive
// under a BundledPMTilesSource (see that file for why — Capacitor's local
// asset server doesn't support the Range requests pmtiles' default fetch
// source relies on).
const pmtilesProtocol = new PMTilesProtocol();
pmtilesProtocol.add(new PMTiles(new BundledPMTilesSource(OFFLINE_PMTILES_URL)));
addProtocol("pmtiles", pmtilesProtocol.tile);

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

// Anchor layer, not a mask — see docs/HANDOFF.md §3b. Outline only. Style
// swaps (online <-> offline) replace the whole style, including this
// source/layer, so this runs on every "style.load", not just the first.
function addCityBoundaryLayer(map: MapLibreMap) {
  if (map.getSource("city-boundary")) return;

  map.addSource("city-boundary", {
    type: "geojson",
    data: cityBoundary as GeoJSON.FeatureCollection,
  });

  map.addLayer({
    id: "city-boundary-line",
    type: "line",
    source: "city-boundary",
    paint: {
      "line-color": "#2563eb",
      "line-width": 2,
    },
  });
}

export function CityMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isOnline = useNetworkStatus();
  // The style actually applied to the map, so the isOnline effect below can
  // skip the redundant setStyle call that would otherwise fire right after
  // mount (both effects see the same isOnline value on first render).
  const appliedOnlineStyleRef = useRef(isOnline);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: appliedOnlineStyleRef.current ? OSM_STYLE : OFFLINE_STYLE,
      center: SJDM_CENTER,
      zoom: INITIAL_ZOOM,
    });

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(new LocateControl(), "top-right");

    let cancelled = false;

    // React Strict Mode in dev mounts/unmounts/remounts this effect; skip
    // if this map instance was already torn down before "style.load" fired.
    map.on("style.load", () => {
      if (cancelled) return;
      addCityBoundaryLayer(map);
    });

    mapRef.current = map;

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || appliedOnlineStyleRef.current === isOnline) return;

    appliedOnlineStyleRef.current = isOnline;
    map.setStyle(isOnline ? OSM_STYLE : OFFLINE_STYLE);
  }, [isOnline]);

  return <div ref={containerRef} className="h-full w-full" />;
}
