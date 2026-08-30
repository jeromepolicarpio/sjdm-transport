import type { LngLat } from "@/lib/haversine";
import { snapToNearestRoad } from "@/lib/osrm";
import { reverseGeocode } from "@/lib/photon";
import type { FarePoint } from "@/types/tricycle";

/**
 * Turns a raw map tap into a resolved FarePoint: snaps to the nearest road
 * (so the pin agrees with the OSRM route line), then reverse-geocodes the
 * *snapped* coords (so the label matches where the pin actually sits). Each
 * step degrades independently — a snap failure keeps the raw tap, a geocode
 * failure leaves `label`/`district` null so the caller falls back to
 * showing coordinates. Never throws.
 */
export async function resolveFarePoint(
  rawCoords: LngLat,
  signal?: AbortSignal,
): Promise<FarePoint> {
  const coords = (await snapToNearestRoad(rawCoords, signal)) ?? rawCoords;
  const place = await reverseGeocode(coords, signal);

  return {
    coords,
    label: place?.name ?? null,
    district: place?.district ?? null,
    isResolving: false,
  };
}

/** The instantly-visible placeholder point, before resolveFarePoint settles. */
export function pendingFarePoint(rawCoords: LngLat): FarePoint {
  return { coords: rawCoords, label: null, district: null, isResolving: true };
}
