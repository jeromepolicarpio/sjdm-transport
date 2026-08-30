"use client";

import { Map as MapLibreMap, Marker, NavigationControl, Popup, addProtocol, config } from "maplibre-gl";
import type { MapGeoJSONFeature, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PMTiles, Protocol as PMTilesProtocol } from "pmtiles";
import type { Ref } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";

import { BundledPMTilesSource } from "@/lib/bundled-pmtiles-source";
import { cityBoundary, cityBounds } from "@/lib/city-boundary";
import { FARE_MARKER_PIN_PX, syncFareMarker } from "@/lib/fare-markers";
import {
  computeFareTripBounds,
  ensureFareRouteLayer,
  updateFareRouteLine,
} from "@/lib/fare-route-layer";
import type { LngLat } from "@/lib/haversine";
import { LocateControl } from "@/lib/locate-control";
import { OFFLINE_STYLE, OFFLINE_PMTILES_URL } from "@/lib/offline-style";
import {
  LAYER_PREFIX,
  ROUTE_LINE_LAYER_SUFFIX,
  computeRouteBounds,
  ensureDarkOverlayLayer,
  setDarkOverlayVisible,
  syncPuvRouteLayers,
} from "@/lib/route-layers";
import { useNetworkStatus } from "@/lib/use-network-status";
import type { PuvRoute } from "@/types/puv-route";
import type { FareField, FarePoint } from "@/types/tricycle";

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

// frameFareTrip's fitBounds padding — see that method for what each value
// accounts for.
const MARGIN_PX = 24;
const MAP_CONTROLS_CLEARANCE_PX = 80; // top-right NavigationControl + LocateControl stack
// fitBounds fits the marker's *coordinate*, not its drawn extent — an
// origin/destination pin is a DOM element anchored at its tip ("bottom"),
// so it draws entirely above that coordinate. Plain MARGIN_PX on top left
// only 24px of clearance, letting the pin's crown poke out of the canvas
// and overlap AppHeader/StartEndBar above it. Match the pin's own height
// (FARE_MARKER_PIN_PX, from fare-markers.ts) plus a small buffer instead.
const FARE_MARKER_TOP_CLEARANCE_PX = FARE_MARKER_PIN_PX + MARGIN_PX;
// fitBounds silently no-ops (a console warnOnce, camera never moves) if
// padding leaves no positive space to fit content into — on a short or
// landscape viewport, top+bottom (or left+right) padding sized for a taller
// screen can exceed the canvas outright. Scale padding down proportionally
// once it would eat more than this fraction of the canvas, so a cramped
// viewport degrades to a tighter frame instead of losing the animation.
const MAX_PADDING_FRACTION = 0.6;

interface FitPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function clampFitPadding(padding: FitPadding, canvasWidth: number, canvasHeight: number): FitPadding {
  const maxVertical = canvasHeight * MAX_PADDING_FRACTION;
  const maxHorizontal = canvasWidth * MAX_PADDING_FRACTION;
  const verticalTotal = padding.top + padding.bottom;
  const horizontalTotal = padding.left + padding.right;
  const verticalScale = verticalTotal > maxVertical ? maxVertical / verticalTotal : 1;
  const horizontalScale = horizontalTotal > maxHorizontal ? maxHorizontal / horizontalTotal : 1;

  return {
    top: padding.top * verticalScale,
    bottom: padding.bottom * verticalScale,
    left: padding.left * horizontalScale,
    right: padding.right * horizontalScale,
  };
}

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
  fitToRoute: (routeId: string) => void;
  setDarkOverlay: (visible: boolean) => void;
  frameFareTrip: (
    routeGeometry: GeoJSON.LineString | null,
    origin: LngLat,
    destination: LngLat,
    // Rendered height (px) of whatever overlay covers the bottom of the map
    // for this trip — the mobile FareResultCard, 0 on desktop where it's
    // md:hidden. Measured by the caller (AppShell) since the card has no
    // fixed height. See frameFareTrip's own comment for why this can't be a
    // constant here.
    bottomOverlayPx: number,
  ) => void;
  resetView: () => void;
}

interface CityMapProps {
  ref?: Ref<CityMapHandle>;
  routes: PuvRoute[];
  visibleRouteIds: ReadonlySet<string>;
  selectedRouteId: string | null;
  pickingField: FareField | null;
  onPickPoint: (field: FareField, point: LngLat) => void;
  fareOrigin: FarePoint | null;
  fareDestination: FarePoint | null;
  fareRouteGeometry: GeoJSON.LineString | null;
}

function buildRoutePopupContent(routeName: string, vehicleLabel: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "text-xs";

  const title = document.createElement("strong");
  title.textContent = routeName;
  container.appendChild(title);

  if (vehicleLabel) {
    const subtitle = document.createElement("div");
    subtitle.className = "mt-0.5 text-slate-500";
    subtitle.textContent = vehicleLabel;
    container.appendChild(subtitle);
  }

  return container;
}

export function CityMap({
  ref,
  routes,
  visibleRouteIds,
  selectedRouteId,
  pickingField,
  onPickPoint,
  fareOrigin,
  fareDestination,
  fareRouteGeometry,
}: CityMapProps) {
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
  const selectedRouteIdRef = useRef(selectedRouteId);
  const pickingFieldRef = useRef(pickingField);
  const onPickPointRef = useRef(onPickPoint);
  const darkOverlayRef = useRef(false);
  const fareOriginRef = useRef(fareOrigin);
  const fareDestinationRef = useRef(fareDestination);
  const fareRouteGeometryRef = useRef(fareRouteGeometry);
  // Marker instances persist across style.load (setStyle wipes GeoJSON
  // sources/layers, but DOM markers are independent of the style) — held
  // outside React state since syncFareMarker mutates/reuses them in place.
  const originMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  // containerRef's element is also MapLibre's own `container` — it appends
  // its own classes to it imperatively (notably "maplibregl-map", which
  // carries the `overflow: hidden` that clips markers to the map's box). A
  // React-controlled `className` on this same node would overwrite the
  // whole attribute on every pickingField change and silently wipe those
  // out — letting a marker/route render outside the map and over whatever
  // sits above it (AppHeader/StartEndBar). So this container's className
  // must stay a static string forever — the picking cursor is set on the
  // canvas element instead (also the only element `cursor-crosshair` on
  // the container would ever have affected: `.maplibregl-canvas-container`
  // sets its own explicit `cursor: grab`, which wins over inheriting from
  // an ancestor class regardless).
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = pickingField ? "crosshair" : "";
  }, [pickingField]);
  useEffect(() => {
    routesRef.current = routes;
    visibleRouteIdsRef.current = visibleRouteIds;
    selectedRouteIdRef.current = selectedRouteId;
    pickingFieldRef.current = pickingField;
    onPickPointRef.current = onPickPoint;
    fareOriginRef.current = fareOrigin;
    fareDestinationRef.current = fareDestination;
    fareRouteGeometryRef.current = fareRouteGeometry;
  }, [
    routes,
    visibleRouteIds,
    selectedRouteId,
    pickingField,
    onPickPoint,
    fareOrigin,
    fareDestination,
    fareRouteGeometry,
  ]);
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
    fitToRoute(routeId) {
      const map = mapRef.current;
      const route = routesRef.current.find((r) => r.id === routeId);
      if (!map || !route) return;
      map.fitBounds(computeRouteBounds(route), { padding: 48, maxZoom: 16 });
    },
    setDarkOverlay(visible) {
      darkOverlayRef.current = visible;
      const map = mapRef.current;
      if (map) setDarkOverlayVisible(map, visible);
    },
    frameFareTrip(routeGeometry, origin, destination, bottomOverlayPx) {
      const map = mapRef.current;
      if (!map) return;
      // fitBounds padding is measured in canvas-local pixels — AppHeader,
      // StartEndBar, and the desktop sidebar are all flex siblings of this
      // component's own container (never painted over the canvas), so they
      // need no padding at all; only what actually overlays the canvas does:
      // the top-right NavigationControl/LocateControl stack, and on mobile,
      // FareResultCard along the bottom (bottomOverlayPx — 0 on desktop,
      // where it's md:hidden). Single fitBounds call either way — MapLibre
      // already arcs out-and-back-in on its own for a longer trip, without a
      // separate staged zoom-out/zoom-in sequence.
      const canvas = map.getCanvas();
      // A zero-sized canvas (e.g. mid-layout, or an ancestor briefly
      // display:none) would drive every clamped value to 0 and hand
      // MapLibre a padding that exactly consumes the canvas — its fitBounds
      // math divides by the remaining space, so that's a divide-by-zero
      // (-Infinity zoom) rather than the graceful no-op a missing map
      // instance gets above.
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
      const padding = clampFitPadding(
        {
          top: FARE_MARKER_TOP_CLEARANCE_PX,
          right: MAP_CONTROLS_CLEARANCE_PX,
          left: MARGIN_PX,
          bottom: bottomOverlayPx + MARGIN_PX,
        },
        canvas.clientWidth,
        canvas.clientHeight,
      );
      map.fitBounds(computeFareTripBounds(routeGeometry, origin, destination), {
        padding,
        maxZoom: 16,
        duration: 1200,
      });
    },
    // Deliberate counterpart to frameFareTrip: called when the fare card is
    // closed and the trip cleared, so the camera animates back out to the
    // whole-city view instead of being left stranded on a now-empty,
    // tightly-zoomed neighborhood. Same duration as frameFareTrip so the
    // zoom-out reads as its inverse.
    resetView() {
      mapRef.current?.fitBounds(cityBounds, { padding: 40, duration: 1200 });
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: appliedOnlineStyleRef.current ? OSM_STYLE : OFFLINE_STYLE,
      center: SJDM_CENTER,
      zoom: INITIAL_ZOOM,
      maxBounds: cityBounds,
    });

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(new LocateControl(), "top-right");

    let cancelled = false;

    map.on("click", (e) => {
      if (pickingFieldRef.current) {
        onPickPointRef.current(pickingFieldRef.current, {
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        });
        return;
      }

      const lineLayerIds = (map.getStyle()?.layers ?? [])
        .filter(
          (layer) =>
            layer.id.startsWith(LAYER_PREFIX) &&
            layer.id.endsWith(ROUTE_LINE_LAYER_SUFFIX),
        )
        .map((layer) => layer.id);
      if (lineLayerIds.length === 0) return;

      const features: MapGeoJSONFeature[] = map.queryRenderedFeatures(e.point, {
        layers: lineLayerIds,
      });
      const routeName = features[0]?.properties?.routeName as string | undefined;
      if (!routeName) return;

      const vehicleLabel = (features[0]?.properties?.vehicleLabel as string) ?? "";
      new Popup({ closeButton: true })
        .setLngLat(e.lngLat)
        .setDOMContent(buildRoutePopupContent(routeName, vehicleLabel))
        .addTo(map);
    });

    // maxBounds alone only stops panning past the box; without a minZoom
    // floor the user can still zoom out until the whole city (and beyond)
    // fits with room to spare. Recomputed on "resize" too, since the zoom
    // level that exactly fits cityBounds depends on the container's size.
    const applyMinZoom = () => {
      if (cancelled) return;
      const camera = map.cameraForBounds(cityBounds);
      // Cap at INITIAL_ZOOM: on a wide viewport the fit-to-bounds zoom can
      // exceed the initial framing, and setMinZoom snaps the current camera
      // up to satisfy the new floor — visible as an unwanted zoom-in jump.
      if (camera?.zoom !== undefined) map.setMinZoom(Math.min(camera.zoom, INITIAL_ZOOM));
    };
    map.on("load", applyMinZoom);
    map.on("resize", applyMinZoom);

    // React Strict Mode in dev mounts/unmounts/remounts this effect; skip
    // if this map instance was already torn down before "style.load" fired.
    map.on("style.load", () => {
      if (cancelled) return;
      isStyleReadyRef.current = true;
      addCityBoundaryLayer(map);
      ensureDarkOverlayLayer(map);
      syncPuvRouteLayers(
        map,
        routesRef.current,
        visibleRouteIdsRef.current,
        selectedRouteIdRef.current,
      );
      setDarkOverlayVisible(map, darkOverlayRef.current);
      ensureFareRouteLayer(map);
      updateFareRouteLine(
        map,
        fareOriginRef.current?.coords ?? null,
        fareDestinationRef.current?.coords ?? null,
        fareRouteGeometryRef.current,
      );
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
    syncPuvRouteLayers(map, routes, visibleRouteIds, selectedRouteId);
  }, [routes, visibleRouteIds, selectedRouteId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    originMarkerRef.current = syncFareMarker(
      map,
      originMarkerRef.current,
      fareOrigin,
      "origin",
    );
    destinationMarkerRef.current = syncFareMarker(
      map,
      destinationMarkerRef.current,
      fareDestination,
      "destination",
    );
  }, [fareOrigin, fareDestination]);

  // Markers are independent of map style/lifecycle beyond the map instance
  // itself, so they need their own teardown on unmount (map.remove() doesn't
  // reach into externally-created Markers). Nulling the refs (not just
  // removing the markers) matters: React Strict Mode mounts/unmounts/
  // remounts this component in dev, and without nulling, syncFareMarker
  // would see a stale-but-non-null `existing` marker on the remount and
  // reuse it — moving/relabeling a marker that was never added to the new
  // map instance, so the pin would silently never appear. (syncFareMarker
  // also guards against this directly via existing.getElement().isConnected,
  // but nulling here is the actual fix — the guard is defense in depth.)
  useEffect(() => {
    return () => {
      originMarkerRef.current?.remove();
      originMarkerRef.current = null;
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReadyRef.current) return;
    updateFareRouteLine(
      map,
      fareOrigin?.coords ?? null,
      fareDestination?.coords ?? null,
      fareRouteGeometry,
    );
  }, [fareOrigin, fareDestination, fareRouteGeometry]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
    />
  );
}
