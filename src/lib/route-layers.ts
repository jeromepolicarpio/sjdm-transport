import { lineString } from "@turf/helpers";
import type { Map as MapLibreMap } from "maplibre-gl";

import { isInsideCity } from "@/lib/city-boundary";
import type { AlternateRoute, PuvRoute } from "@/types/puv-route";

// Every layer/source this module adds is prefixed so it can be found and
// torn down without tracking ids across calls (see removePuvRouteLayers).
const LAYER_PREFIX = "puv-route-";

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

function featureCollection(
  features: GeoJSON.Feature[],
): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

function addRouteLineLayers(map: MapLibreMap, route: PuvRoute): void {
  const { insideSegments, outsideSegments } = splitLineByCityBoundary(
    route.geojson,
  );
  const insideSourceId = `${LAYER_PREFIX}${route.id}-inside`;
  const outsideSourceId = `${LAYER_PREFIX}${route.id}-outside`;

  map.addSource(insideSourceId, {
    type: "geojson",
    data: featureCollection(insideSegments),
  });
  map.addSource(outsideSourceId, {
    type: "geojson",
    data: featureCollection(outsideSegments),
  });

  map.addLayer({
    id: `${insideSourceId}-line`,
    type: "line",
    source: insideSourceId,
    paint: { "line-color": route.color, "line-width": 4 },
  });

  map.addLayer({
    id: `${outsideSourceId}-line`,
    type: "line",
    source: outsideSourceId,
    paint: {
      "line-color": route.color,
      "line-width": 3,
      "line-opacity": 0.45,
    },
  });
}

function addAlternateRouteLayer(
  map: MapLibreMap,
  route: PuvRoute,
  alternate: AlternateRoute,
): void {
  const sourceId = `${LAYER_PREFIX}${route.id}-alt-${alternate.id}`;

  map.addSource(sourceId, { type: "geojson", data: alternate.geojson });
  map.addLayer({
    id: `${sourceId}-line`,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": route.color,
      "line-width": 2,
      "line-opacity": 0.6,
      "line-dasharray": [2, 2],
    },
  });
}

function addStopLayer(map: MapLibreMap, route: PuvRoute): void {
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

  // Boolean case conditions must compare explicitly (["==", ..., true])
  // rather than testing property truthiness directly — a stop authored
  // later without one of these fields would otherwise error the expression
  // at runtime instead of falling through to the default branch.
  map.addLayer({
    id: `${sourceId}-circle`,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-color": route.color,
      "circle-radius": [
        "case",
        ["==", ["get", "shared"], true],
        7,
        ["==", ["get", "isTerminus"], true],
        6,
        4,
      ],
      "circle-opacity": ["case", ["==", ["get", "isOutsideCity"], true], 0.45, 1],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": ["case", ["==", ["get", "shared"], true], 2, 1],
    },
  });
}

// Removes every layer/source this module previously added, found by the
// LAYER_PREFIX naming convention — simpler and less error-prone than
// diffing against whatever the last-synced route/visibility state was.
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
): void {
  removePuvRouteLayers(map);

  routes
    .filter((route) => visibleRouteIds.has(route.id))
    .forEach((route) => {
      addRouteLineLayers(map, route);
      route.alternateRoutes?.forEach((alternate) =>
        addAlternateRouteLayer(map, route, alternate),
      );
      addStopLayer(map, route);
    });
}
