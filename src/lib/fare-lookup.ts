import { fareSchedule } from "@/data/fare-schedule";
import type {
  DistanceSource,
  FareResult,
  FareScheduleEntry,
  GasolinePriceBracket,
  PassengerType,
  TripType,
} from "@/types/tricycle";
import type { LngLat } from "@/lib/haversine";
import { haversineDistanceKm } from "@/lib/haversine";
import { getRoadRoute } from "@/lib/osrm";

const ORDINANCE_REFERENCE = "CSJDM City Ordinance No. 2022-107-06";

export function findFareScheduleEntry(
  bracket: GasolinePriceBracket,
): FareScheduleEntry {
  const entry = fareSchedule.find((e) => e.bracket === bracket);
  if (!entry) {
    throw new Error(`No fare schedule entry for bracket ${bracket}`);
  }
  return entry;
}

// Regular trip: first-2km base fare, plus the flat per-km rate for whatever
// distance is beyond that. Discounted passengers use the ordinance's own
// flat discounted base figure (entry.discountedRegularTripFare) — NOT a
// computed 20% off firstTwoKmFare, since the published figures don't reduce
// to a clean 20% (see the warning comment in fare-schedule.ts). The
// ordinance gives no separate discounted per-km rate, so the succeeding-km
// rate is the same for both passenger types.
function regularTripFare(
  entry: FareScheduleEntry,
  distanceKm: number,
  passengerType: PassengerType,
): number {
  const base =
    passengerType === "discounted"
      ? entry.discountedRegularTripFare
      : entry.firstTwoKmFare;
  const extraKm = Math.max(0, distanceKm - 2);
  return base + extraKm * entry.succeedingKmFarePerPassenger;
}

// Special trip: flat, exclusive/chartered rate to or from a TODA terminal —
// not distance-based per the ordinance.
function specialTripFare(
  entry: FareScheduleEntry,
  passengerType: PassengerType,
): number {
  return passengerType === "discounted"
    ? entry.discountedSpecialTripFare
    : entry.specialTripOnePassengerFare;
}

// Prefers OSRM's road-network route; falls back to straight-line if offline,
// OSRM is unreachable, or it finds no route. The fallback is flagged via
// DistanceSource so the UI can tell the passenger the figure may be an
// underestimate, and routeGeometry is null so the map falls back to a
// straight line too rather than drawing a road path that was never fetched.
// isOnline skips the OSRM request entirely rather than letting it fail after
// its own timeout — offline, that request cannot succeed, so waiting out
// the timeout just stalls the calculator for no benefit.
async function resolveDistance(
  origin: LngLat,
  destination: LngLat,
  isOnline: boolean,
  signal?: AbortSignal,
): Promise<{
  distanceKm: number;
  distanceSource: DistanceSource;
  routeGeometry: GeoJSON.LineString | null;
}> {
  const route = isOnline ? await getRoadRoute(origin, destination, signal) : null;
  if (route !== null) {
    return {
      distanceKm: route.distanceKm,
      distanceSource: "road",
      routeGeometry: route.geometry,
    };
  }
  return {
    distanceKm: haversineDistanceKm(origin, destination),
    distanceSource: "straight_line",
    routeGeometry: null,
  };
}

export async function calculateFare(
  origin: LngLat,
  destination: LngLat,
  bracket: GasolinePriceBracket,
  tripType: TripType,
  passengerType: PassengerType,
  isOnline: boolean,
  signal?: AbortSignal,
): Promise<FareResult> {
  const { distanceKm, distanceSource, routeGeometry } = await resolveDistance(
    origin,
    destination,
    isOnline,
    signal,
  );
  const entry = findFareScheduleEntry(bracket);

  const fare =
    tripType === "special"
      ? specialTripFare(entry, passengerType)
      : regularTripFare(entry, distanceKm, passengerType);

  return {
    fare: Math.round(fare * 100) / 100,
    distanceKm,
    distanceSource,
    routeGeometry,
    bracket,
    tripType,
    ordinanceReference: ORDINANCE_REFERENCE,
  };
}
