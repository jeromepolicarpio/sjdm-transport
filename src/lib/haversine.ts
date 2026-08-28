const EARTH_RADIUS_KM = 6371;

export interface LngLat {
  lng: number;
  lat: number;
}

// Straight-line distance, informational only. OSRM will replace this for the
// actual calculator once routing is wired in (see docs/HANDOFF.md §3) — it is
// never the basis for a fare.
export function haversineDistanceKm(a: LngLat, b: LngLat): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
