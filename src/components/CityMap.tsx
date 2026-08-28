"use client";

import { Map as MapLibreMap, NavigationControl, addProtocol, config } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol as PMTilesProtocol } from "pmtiles";
import type { Ref } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";

import { BundledPMTilesSource } from "@/lib/bundled-pmtiles-source";
import { cityBoundary } from "@/lib/city-boundary";
import { LocateControl } from "@/lib/locate-control";
import { OFFLINE_STYLE, OFFLINE_PMTILES_URL } from "@/lib/offline-style";
import { syncPuvRouteLayers } from "@/lib/route-layers";
import { useNetworkStatus } from "@/lib/use-network-status";
import type { PuvRoute } from "@/types/puv-route";

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
const STOP_FLY_TO_ZOOM = 15;

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
    data: cityBoundary,
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

export interface CityMapHandle {
  flyTo: (coords: [number, number]) => void;
}

interface CityMapProps {
  ref?: Ref<CityMapHandle>;
  routes: PuvRoute[];
  visibleRouteIds: ReadonlySet<string>;
}

export function CityMap({ ref, routes, visibleRouteIds }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const isOnline = useNetworkStatus();
  // The style actually applied to the map, so the isOnline effect below
  // can skip the redundant setStyle call that would otherwise fire right
  // after mount (both effects see the same isOnline value on first render).
  const appliedOnlineStyleRef = useRef(isOnline);
  // "style.load" fires asynchronously, long after this effect's initial
  // closure runs, so it must read current route state from a ref rather
  // than close over the render's routes/visibleRouteIds.
  const routesRef = useRef(routes);
  const visibleRouteIdsRef = useRef(visibleRouteIds);
  useEffect(() => {
    routesRef.current = routes;
    visibleRouteIdsRef.current = visibleRouteIds;
  }, [routes, visibleRouteIds]);
  // Map.isStyleLoaded() also waits on every visible tile/image, so it stays
  // false well after the style itself is ready to accept layers — a route
  // toggle mid-tile-load would silently no-op against that guard. Track
  // "style spec applied" ourselves instead: true once "style.load" fires,
  // false again the instant a new style is requested.
  const isStyleReadyRef = useRef(false);

  useImperativeHandle(ref, () => ({
    flyTo(coords) {
      mapRef.current?.flyTo({ center: coords, zoom: STOP_FLY_TO_ZOOM });
    },
  }));

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
      isStyleReadyRef.current = true;
      addCityBoundaryLayer(map);
      syncPuvRouteLayers(map, routesRef.current, visibleRouteIdsRef.current);
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
    isStyleReadyRef.current = false;
    map.setStyle(isOnline ? OSM_STYLE : OFFLINE_STYLE);
  }, [isOnline]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    syncPuvRouteLayers(map, routes, visibleRouteIds);
  }, [routes, visibleRouteIds]);

  return <div ref={containerRef} className="h-full w-full" />;
}
