import type { LngLat } from "@/lib/haversine";
import { withTimeoutSignal } from "@/lib/fetch-timeout";

// Public OSRM demo server — free, unauthenticated, no API key. See
// docs/HANDOFF.md §2. Used for road-network trip distance/geometry; never
// treated as the fare source itself, only as an input to it.
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";
const OSRM_NEAREST_URL = "https://router.project-osrm.org/nearest/v1/driving";
// A tap this far from the nearest known road is more likely open ground
// (a field, a river, a gap in OSM coverage) than a real address a few
// meters off the road centerline — keep the raw tap rather than snapping it
// somewhere the passenger didn't point at.
const MAX_SNAP_DISTANCE_M = 200;

interface OsrmRouteResponse {
  code: string;
  routes?: { distance: number; geometry: GeoJSON.LineString }[];
}

interface OsrmNearestResponse {
  code: string;
  waypoints?: { location: [number, number]; distance: number }[];
}

export interface RoadRoute {
  distanceKm: number;
  geometry: GeoJSON.LineString;
}

/**
 * Snaps a raw tap/click to the nearest drivable road via OSRM's /nearest
 * service, so a pin lands on the street the OSRM route will actually start
 * or end at (routing snaps internally regardless — this makes the pin agree
 * with the drawn line instead of visibly floating off it). Returns null if
 * OSRM is unreachable, finds nothing, or the nearest road is implausibly
 * far away (see MAX_SNAP_DISTANCE_M) — callers should keep the raw tap in
 * that case.
 */
export async function snapToNearestRoad(
  coords: LngLat,
  signal?: AbortSignal,
): Promise<LngLat | null> {
  const url = `${OSRM_NEAREST_URL}/${coords.lng},${coords.lat}?number=1`;
  const { signal: requestSignal, clear } = withTimeoutSignal(signal);

  try {
    const response = await fetch(url, { signal: requestSignal });
    if (!response.ok) return null;

    const data = (await response.json()) as OsrmNearestResponse;
    const waypoint = data.waypoints?.[0];
    if (data.code !== "Ok" || !waypoint) return null;
    if (waypoint.distance > MAX_SNAP_DISTANCE_M) return null;

    const [lng, lat] = waypoint.location;
    return { lng, lat };
  } catch {
    return null;
  } finally {
    clear();
  }
}

/**
 * Road-network route between two points, via the OSRM demo server's driving
 * profile (no tricycle-specific profile exists; driving is the closest
 * available road-network approximation) — distance plus the actual road
 * geometry, so the map can draw the trip along real streets instead of a
 * straight line. Returns null on any network failure, timeout, or "no route
 * found" response — callers should fall back to straight-line distance
 * rather than surface an error, since this is a best-effort refinement, not
 * a fare-critical dependency.
 */
export async function getRoadRoute(
  origin: LngLat,
  destination: LngLat,
  signal?: AbortSignal,
): Promise<RoadRoute | null> {
  const url = `${OSRM_ROUTE_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const { signal: requestSignal, clear } = withTimeoutSignal(signal);

  try {
    const response = await fetch(url, { signal: requestSignal });
    if (!response.ok) return null;

    const data = (await response.json()) as OsrmRouteResponse;
    if (data.code !== "Ok" || !data.routes?.length) return null;

    return {
      distanceKm: data.routes[0].distance / 1000,
      geometry: data.routes[0].geometry,
    };
  } catch {
    return null;
  } finally {
    clear();
  }
}
