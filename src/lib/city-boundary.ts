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
