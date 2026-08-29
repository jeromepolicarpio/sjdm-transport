import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

import cityBoundaryData from "@/data/city-boundary.json";

export const cityBoundary = cityBoundaryData as GeoJSON.FeatureCollection;

// Cast, not validated: the source is a re-fetchable OSM relation (see
// city-boundary.json's "fetchedOn"), so a future re-fetch could legitimately
// come back as a MultiPolygon rather than a Polygon. turf's
// booleanPointInPolygon accepts either.
const cityBoundaryGeometry = cityBoundary.features[0].geometry as
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon;

export function isInsideCity(coords: [number, number]): boolean {
  return booleanPointInPolygon(point(coords), cityBoundaryGeometry);
}

const BOUNDS_PADDING_DEGREES = 0.02;

function computeBounds(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [[number, number], [number, number]] {
  const rings =
    geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return [
    [minLng - BOUNDS_PADDING_DEGREES, minLat - BOUNDS_PADDING_DEGREES],
    [maxLng + BOUNDS_PADDING_DEGREES, maxLat + BOUNDS_PADDING_DEGREES],
  ];
}

// Padded bounding box around the city boundary polygon — keeps the map
// panned/zoomed to SJDM only. Same idea as sjdm-report-main's MapView.tsx
// (Leaflet maxBounds), computed here instead of hardcoded so it stays in
// sync with city-boundary.json if that's ever re-fetched.
export const cityBounds = computeBounds(cityBoundaryGeometry);
