// Fare model per City Ordinance No. 2022-107-06 — zone-pair lookup, not a distance formula.
// See docs/HANDOFF.md §3 before changing anything in this file.

export type PassengerType = "regular" | "discounted"; // discounted: senior, PWD, student

export interface TricycleZone {
  id: string;
  number: number;
  name: string;
  barangays: string[];
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  todas: string[]; // TODA ids operating in this zone
}

export interface Toda {
  id: string;
  name: string;
  abbreviation: string;
  zoneId: string;
}

export interface FareEntry {
  originZoneId: string;
  destinationZoneId: string;
  regularFare: number;
  discountedFare: number;
  isSpecialTrip: boolean; // true when no TODA serves this pair at matrix rates
}

export type FareStatus = "ok" | "special_trip" | "out_of_coverage" | "data_pending";

export interface FareResult {
  status: FareStatus;
  regularFare: number | null;
  discountedFare: number | null;
  originZone: TricycleZone | null;
  destinationZone: TricycleZone | null;
  distanceKm: number; // informational only, NOT the fare basis
  ordinanceReference: string;
}
