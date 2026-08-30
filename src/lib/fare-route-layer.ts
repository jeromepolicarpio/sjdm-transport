import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import type { LngLat } from "@/lib/haversine";

// Origin/destination points are rendered as maplibre-gl Markers now (see
// fare-markers.ts) — DOM elements, not a GeoJSON layer, since a symbol
// layer's text-field silently renders nothing on either map style (neither
// defines "glyphs"). This module only draws the connecting line.
const LINE_SOURCE_ID = "fare-points-line";
export const FARE_LINE_LAYER_ID = "fare-points-line-layer";

function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

// Added once per style load, alongside the city boundary layer — see
// CityMap's "style.load" handler. Starts empty; updateFareRouteLine fills
// it in as the passenger picks origin/destination.
export function ensureFareRouteLayer(map: MapLibreMap): void {
  if (map.getSource(LINE_SOURCE_ID)) return;

  map.addSource(LINE_SOURCE_ID, {
    type: "geojson",
    data: emptyFeatureCollection(),
  });
  map.addLayer({
    id: FARE_LINE_LAYER_ID,
    type: "line",
    source: LINE_SOURCE_ID,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#2563eb",
      "line-width": 5,
    },
  });
}

// Bounding box across whatever there is to show — the OSRM road geometry if
// it's arrived, otherwise just the two points — for CityMap's
// "frame the trip" camera move. Same min/max-scan approach as
// route-layers.ts's computeRouteBounds.
export function computeFareTripBounds(
  routeGeometry: GeoJSON.LineString | null,
  origin: LngLat,
  destination: LngLat,
): [[number, number], [number, number]] {
  const coords: [number, number][] = routeGeometry
    ? (routeGeometry.coordinates as [number, number][])
    : [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ];

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
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

// Called from CityMap's origin/destination effect. No-ops if the layer
// hasn't been added yet (style not loaded) — the caller guards on
// isStyleReadyRef before calling this. `routeGeometry` is the OSRM road
// path (see fare-lookup.ts); when it's null (still loading, or OSRM was
// unreachable) the connecting line falls back to a straight segment between
// the two points instead.
export function updateFareRouteLine(
  map: MapLibreMap,
  origin: LngLat | null,
  destination: LngLat | null,
  routeGeometry: GeoJSON.LineString | null = null,
): void {
  const lineSource = map.getSource(LINE_SOURCE_ID) as GeoJSONSource | undefined;
  if (!lineSource) return;

  const lineGeometry: GeoJSON.LineString | null =
    routeGeometry ??
    (origin && destination
      ? {
          type: "LineString",
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        }
      : null);

  lineSource.setData({
    type: "FeatureCollection",
    features: lineGeometry
      ? [{ type: "Feature", geometry: lineGeometry, properties: {} }]
      : [],
  });
}
