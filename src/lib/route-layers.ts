import { lineString } from "@turf/helpers";
import type { Map as MapLibreMap } from "maplibre-gl";

import { isInsideCity } from "@/lib/city-boundary";
import type { AlternateRoute, PuvRoute } from "@/types/puv-route";

// Every layer/source this module adds is prefixed so it can be found and
// torn down without tracking ids across calls (see removePuvRouteLayers).
// Exported so CityMap.tsx can delegate a single click listener across
// every route line layer without rebinding per sync (layers are torn down
// and rebuilt on every syncPuvRouteLayers call, so a listener bound to a
// specific layer id would double up the next time that id is reused).
export const LAYER_PREFIX = "puv-route-";
export const ROUTE_LINE_LAYER_SUFFIX = "-line";

// Persistent background layer toggled by the map legend's "dark overlay"
// checkbox. Not part of LAYER_PREFIX/teardown-and-rebuild — it's added once
// per style load and only has its visibility flipped, so it must sit below
// the route layers regardless of how many times those get resynced.
export const DARK_OVERLAY_LAYER_ID = "puv-dark-overlay";

const DIMMED_OPACITY_FACTOR = 0.25;

// Splits a route line into inside/outside-city runs so the in-city portion
// can render at full weight and the rest lighter — docs/HANDOFF.md §3b (the
// boundary anchors the map, it does not fence it). A run's closing vertex is
// duplicated as the next run's opening vertex so the two styles stay
// visually joined; this is an approximation, not an interpolation onto the
// actual boundary edge.
export function splitLineByCityBoundary(
  line: GeoJSON.Feature<GeoJSON.LineString>,
): {
  insideSegments: GeoJSON.Feature<GeoJSON.LineString>[];
  outsideSegments: GeoJSON.Feature<GeoJSON.LineString>[];
} {
  const insideSegments: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  const outsideSegments: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  let currentRun: [number, number][] = [];
  let currentInside: boolean | null = null;

  const flush = () => {
    if (currentRun.length < 2 || currentInside === null) return;
    (currentInside ? insideSegments : outsideSegments).push(
      lineString(currentRun),
    );
  };

  for (const coord of line.geometry.coordinates as [number, number][]) {
    const inside = isInsideCity(coord);

    if (currentInside === null) {
      currentInside = inside;
      currentRun = [coord];
      continue;
    }

    if (inside === currentInside) {
      currentRun.push(coord);
      continue;
    }

    currentRun.push(coord);
    flush();
    currentRun = [coord];
    currentInside = inside;
  }
  flush();

  return { insideSegments, outsideSegments };
}

// Bounding box across a route's main line plus any alternates, for
// CityMap's "fit to selected route" behavior. Plain min/max scan rather than
// pulling in @turf/bbox for one call site.
export function computeRouteBounds(
  route: PuvRoute,
): [[number, number], [number, number]] {
  const allCoords: [number, number][] = [
    ...(route.geojson.geometry.coordinates as [number, number][]),
    ...(route.alternateRoutes?.flatMap(
      (alt) => alt.geojson.geometry.coordinates as [number, number][],
    ) ?? []),
  ];

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of allCoords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function withProperties(
  feature: GeoJSON.Feature<GeoJSON.LineString>,
  properties: Record<string, string>,
): GeoJSON.Feature<GeoJSON.LineString> {
  return { ...feature, properties: { ...feature.properties, ...properties } };
}

function featureCollection(
  features: GeoJSON.Feature[],
): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

function addRouteLineLayers(
  map: MapLibreMap,
  route: PuvRoute,
  isDimmed: boolean,
): void {
  const { insideSegments, outsideSegments } = splitLineByCityBoundary(
    route.geojson,
  );
  const lineProperties = {
    routeId: route.id,
    routeName: route.name,
    vehicleLabel: route.vehicleTypes.join(" / "),
  };
  const insideSourceId = `${LAYER_PREFIX}${route.id}-inside`;
  const outsideSourceId = `${LAYER_PREFIX}${route.id}-outside`;

  map.addSource(insideSourceId, {
    type: "geojson",
    data: featureCollection(
      insideSegments.map((f) => withProperties(f, lineProperties)),
    ),
  });
  map.addSource(outsideSourceId, {
    type: "geojson",
    data: featureCollection(
      outsideSegments.map((f) => withProperties(f, lineProperties)),
    ),
  });

  // A wider, low-contrast casing beneath the line keeps overlapping routes
  // separable as the route count grows — plain color-on-color lines start
  // to merge visually past a handful of corridors.
  map.addLayer({
    id: `${insideSourceId}-casing`,
    type: "line",
    source: insideSourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#ffffff",
      "line-width": 7,
      "line-opacity": isDimmed ? 0.15 : 0.7,
    },
  });

  map.addLayer({
    id: `${insideSourceId}${ROUTE_LINE_LAYER_SUFFIX}`,
    type: "line",
    source: insideSourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": route.color,
      "line-width": 4,
      "line-opacity": isDimmed ? DIMMED_OPACITY_FACTOR : 1,
    },
  });

  map.addLayer({
    id: `${outsideSourceId}${ROUTE_LINE_LAYER_SUFFIX}`,
    type: "line",
    source: outsideSourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": route.color,
      "line-width": 3,
      "line-opacity": isDimmed ? DIMMED_OPACITY_FACTOR * 0.45 : 0.45,
    },
  });
}

function addAlternateRouteLayer(
  map: MapLibreMap,
  route: PuvRoute,
  alternate: AlternateRoute,
  isDimmed: boolean,
): void {
  const sourceId = `${LAYER_PREFIX}${route.id}-alt-${alternate.id}`;
  const properties = {
    routeId: route.id,
    routeName: `${route.name} (alternate: ${alternate.name})`,
    vehicleLabel: route.vehicleTypes.join(" / "),
  };

  map.addSource(sourceId, {
    type: "geojson",
    data: withProperties(alternate.geojson, properties),
  });
  map.addLayer({
    id: `${sourceId}${ROUTE_LINE_LAYER_SUFFIX}`,
    type: "line",
    source: sourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": route.color,
      "line-width": 2,
      "line-opacity": isDimmed ? DIMMED_OPACITY_FACTOR * 0.6 : 0.6,
      "line-dasharray": [2, 2],
    },
  });
}

function addStopLayer(map: MapLibreMap, route: PuvRoute, isDimmed: boolean): void {
  const sourceId = `${LAYER_PREFIX}${route.id}-stops`;
  const features: GeoJSON.Feature<GeoJSON.Point>[] = route.stops.map(
    (stop) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: stop.coords },
      properties: {
        id: stop.id,
        name: stop.name,
        // "shared" drives the multi-route junction indicator (§3b/§9).
        shared: Boolean(stop.sharedWithRouteIds?.length),
        isTerminus: Boolean(stop.isTerminus),
        isOutsideCity: Boolean(stop.isOutsideCity),
      },
    }),
  );

  map.addSource(sourceId, {
    type: "geojson",
    data: featureCollection(features),
  });

  // White fill + thick route-colored stroke reads against both the raster
  // OSM basemap and the offline vector style's #f2efe9 background, where a
  // flat colored dot could wash out.
  // Boolean case conditions must compare explicitly (["==", ..., true])
  // rather than testing property truthiness directly — a stop authored
  // later without one of these fields would otherwise error the expression
  // at runtime instead of falling through to the default branch.
  map.addLayer({
    id: `${sourceId}-circle`,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-color": "#ffffff",
      "circle-radius": [
        "case",
        ["==", ["get", "shared"], true],
        7,
        ["==", ["get", "isTerminus"], true],
        6,
        4,
      ],
      "circle-opacity": [
        "case",
        ["==", ["get", "isOutsideCity"], true],
        isDimmed ? DIMMED_OPACITY_FACTOR : 0.45,
        isDimmed ? DIMMED_OPACITY_FACTOR : 1,
      ],
      "circle-stroke-color": route.color,
      "circle-stroke-width": ["case", ["==", ["get", "shared"], true], 3, 2],
      "circle-stroke-opacity": isDimmed ? DIMMED_OPACITY_FACTOR : 1,
    },
  });
}

// Removes every layer/source this module previously added, found by the
// LAYER_PREFIX naming convention — simpler and less error-prone than
// diffing against whatever the last-synced route/visibility state was.
// Never touches DARK_OVERLAY_LAYER_ID — that layer is managed separately.
export function removePuvRouteLayers(map: MapLibreMap): void {
  const style = map.getStyle();
  if (!style) return;

  style.layers
    ?.filter((layer) => layer.id.startsWith(LAYER_PREFIX))
    .forEach((layer) => map.removeLayer(layer.id));

  Object.keys(style.sources ?? {})
    .filter((sourceId) => sourceId.startsWith(LAYER_PREFIX))
    .forEach((sourceId) => map.removeSource(sourceId));
}

// Full teardown-and-rebuild of all PUV route layers. Cheap at the route
// counts this app deals with (a handful of corridors), and avoids tracking
// incremental diffs between calls.
export function syncPuvRouteLayers(
  map: MapLibreMap,
  routes: PuvRoute[],
  visibleRouteIds: ReadonlySet<string>,
  selectedRouteId: string | null = null,
): void {
  removePuvRouteLayers(map);

  routes
    .filter((route) => visibleRouteIds.has(route.id))
    .forEach((route) => {
      const isDimmed = selectedRouteId !== null && selectedRouteId !== route.id;
      addRouteLineLayers(map, route, isDimmed);
      route.alternateRoutes?.forEach((alternate) =>
        addAlternateRouteLayer(map, route, alternate, isDimmed),
      );
      addStopLayer(map, route, isDimmed);
    });
}

// Added once per style load, sitting below every route layer added after
// it. Visibility is the only thing CityMap ever changes on it.
export function ensureDarkOverlayLayer(map: MapLibreMap): void {
  if (map.getLayer(DARK_OVERLAY_LAYER_ID)) return;

  map.addLayer({
    id: DARK_OVERLAY_LAYER_ID,
    type: "background",
    paint: { "background-color": "#000000", "background-opacity": 0.35 },
    layout: { visibility: "none" },
  });
}

export function setDarkOverlayVisible(map: MapLibreMap, visible: boolean): void {
  if (!map.getLayer(DARK_OVERLAY_LAYER_ID)) return;
  map.setLayoutProperty(
    DARK_OVERLAY_LAYER_ID,
    "visibility",
    visible ? "visible" : "none",
  );
}
