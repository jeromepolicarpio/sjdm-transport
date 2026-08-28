import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

import { fareMatrix } from "@/data/fare-matrix";
import { zones } from "@/data/zones";
import type { FareResult, PassengerType, TricycleZone } from "@/types/tricycle";
import type { LngLat } from "@/lib/haversine";
import { haversineDistanceKm } from "@/lib/haversine";

const ORDINANCE_REFERENCE = "CSJDM City Ordinance No. 2022-107-06";

export function resolveZoneForPoint(coords: LngLat): TricycleZone | null {
  const pt = point([coords.lng, coords.lat]);

  return (
    zones.find((zone) => booleanPointInPolygon(pt, zone.geometry)) ?? null
  );
}

function findFareEntry(originZoneId: string, destinationZoneId: string) {
  return fareMatrix.find(
    (entry) =>
      entry.originZoneId === originZoneId &&
      entry.destinationZoneId === destinationZoneId,
  );
}

// Resolves origin/destination coordinates to zones and looks up the ordinance
// fare for that pair. Never returns a guessed number — see docs/HANDOFF.md §3.
export function calculateZoneFare(
  origin: LngLat,
  destination: LngLat,
): FareResult {
  const distanceKm = haversineDistanceKm(origin, destination);

  const base: Omit<FareResult, "status" | "regularFare" | "discountedFare"> = {
    originZone: null,
    destinationZone: null,
    distanceKm,
    ordinanceReference: ORDINANCE_REFERENCE,
  };

  if (zones.length === 0 || fareMatrix.length === 0) {
    return {
      ...base,
      status: "data_pending",
      regularFare: null,
      discountedFare: null,
    };
  }

  const originZone = resolveZoneForPoint(origin);
  const destinationZone = resolveZoneForPoint(destination);

  if (!originZone || !destinationZone) {
    return {
      ...base,
      originZone,
      destinationZone,
      status: "out_of_coverage",
      regularFare: null,
      discountedFare: null,
    };
  }

  const entry = findFareEntry(originZone.id, destinationZone.id);

  if (!entry) {
    return {
      ...base,
      originZone,
      destinationZone,
      status: "data_pending",
      regularFare: null,
      discountedFare: null,
    };
  }

  return {
    ...base,
    originZone,
    destinationZone,
    status: entry.isSpecialTrip ? "special_trip" : "ok",
    regularFare: entry.isSpecialTrip ? null : entry.regularFare,
    discountedFare: entry.isSpecialTrip ? null : entry.discountedFare,
  };
}

export function fareForPassenger(
  result: FareResult,
  passengerType: PassengerType,
): number | null {
  if (result.status !== "ok") return null;
  return passengerType === "discounted"
    ? result.discountedFare
    : result.regularFare;
}
