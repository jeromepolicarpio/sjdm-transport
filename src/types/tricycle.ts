// Fare model per City Ordinance No. 2022-107-06 — a gasoline-price-tiered
// schedule (flag-down + per-km rate for regular trips, flat rates for
// terminal special trips), not a zone-pair lookup. See docs/HANDOFF.md §3
// before changing anything in this file.

import type { LngLat } from "@/lib/haversine";

export type PassengerType = "regular" | "discounted"; // discounted: senior, PWD, student

// Which fare-calculator input field the map is currently letting the user
// set by tapping — shared between AppShell (owns the value) and CityMap
// (reads it to decide what a map click means).
export type FareField = "origin" | "destination";

// A picked fare point, mid-resolution or resolved. `coords` is set the
// instant the user taps (snapped to the nearest road once that resolves);
// `label`/`district` fill in from reverse geocoding and are null until then
// or if that lookup fails/offline — callers show coords as the fallback.
export interface FarePoint {
  coords: LngLat;
  label: string | null;
  district: string | null;
  isResolving: boolean;
}

// The ordinance re-tiers the fare schedule by prevailing gasoline price.
export type GasolinePriceBracket = "30-50" | "51-70" | "71-90" | "91-110";

// "regular": hailed anywhere, metered by distance (first 2km + per-km rate).
// "special": exclusive/chartered trip to or from a TODA terminal, flat rate.
export type TripType = "regular" | "special";

export interface FareScheduleEntry {
  bracket: GasolinePriceBracket;
  /**
   * minGasolinePrice/maxGasolinePrice through additionalPassengerFare below:
   * transcribed for a faithful, complete record of the published ordinance
   * row (see fare-schedule.ts) even though fare-lookup.ts's calculator only
   * reads firstTwoKmFare, succeedingKmFarePerPassenger,
   * specialTripOnePassengerFare, discountedRegularTripFare, and
   * discountedSpecialTripFare today. Not dead data — a deliberate archival
   * choice, not an unfinished feature.
   */
  minGasolinePrice: number;
  maxGasolinePrice: number;
  /** Regular trip, first 2 km, per passenger (up to 3 sharing). */
  firstTwoKmFare: number;
  /** Regular trip, per passenger, per km beyond the first 2. */
  succeedingKmFarePerPassenger: number;
  /** Special trip, exclusive use, 1 passenger, flat. */
  specialTripOnePassengerFare: number;
  /** Special trip, 2 passengers, flat rate each. */
  specialTripTwoPassengersFareEach: number;
  /** Regular trip, per passenger, up to 3 sharing (same base as firstTwoKmFare). */
  regularTripThreePassengersFareEach: number;
  /** Flat fee for one passenger beyond the normal count (max 1). */
  additionalPassengerFare: number;
  /** Senior/PWD/student 20% discount, regular trip — ordinance-given flat figure. */
  discountedRegularTripFare: number;
  /** Senior/PWD/student 20% discount, special trip — ordinance-given flat figure. */
  discountedSpecialTripFare: number;
}

// "road": OSRM driving-profile route distance — the fare is trustworthy.
// "straight_line": haversine fallback used when offline or OSRM is
// unreachable — always shorter than the real route, so a regular-trip fare
// computed from it is a systematic underestimate. FareResultCard gives this
// its own visible warning state rather than a footnote, precisely because it
// can look like a normal, trustworthy fare otherwise.
export type DistanceSource = "road" | "straight_line";

export interface FareResult {
  fare: number;
  distanceKm: number; // informational only for special trips
  distanceSource: DistanceSource;
  // Road-network path from OSRM, for drawing the trip on the map. Null when
  // distanceSource is "straight_line" (offline or OSRM unreachable) — the
  // map falls back to a straight line between the two points in that case.
  routeGeometry: GeoJSON.LineString | null;
  bracket: GasolinePriceBracket;
  tripType: TripType;
  ordinanceReference: string;
  /**
   * True when tripType is "special" and the trip distance exceeds
   * SPECIAL_TRIP_IN_ZONE_MAX_KM — i.e. the destination is probably outside
   * the TODA's zone of operation, where ordinance note (iv) leaves the fare
   * to agreement between driver and passenger rather than the flat `fare`
   * figure. Always false for regular trips, which are metered and
   * unaffected.
   *
   * False-negative prone when distanceSource is "straight_line": haversine
   * distance is always shorter than the real road distance, so a trip that
   * is actually past the threshold can compute under it and go unflagged.
   * There is no equivalent false-positive risk — a "road" distance is never
   * an overestimate for a real route.
   */
  isLikelyOutsideZone: boolean;
}
