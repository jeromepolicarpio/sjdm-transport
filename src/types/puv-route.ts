// PUV (bus/jeepney) route model. Routes only — no fares — see docs/HANDOFF.md
// §3b for why. Deliberately no fare fields anywhere in this file.

export type VehicleType = "bus" | "jeepney" | "modern_jeepney";

export interface RouteStop {
  id: string;
  name: string;
  coords: [number, number]; // [longitude, latitude]
  isOutsideCity: boolean; // drives lighter styling beyond the SJDM line
  isTerminus: boolean; // handoff point — app's coverage ends here
  sharedWithRouteIds?: string[]; // for multi-route indicators at junctions
}

export interface AlternateRoute {
  id: string;
  name: string;
  description?: string;
  geojson: GeoJSON.Feature<GeoJSON.LineString>;
  stops?: RouteStop[];
}

export interface PuvRoute {
  id: string;
  name: string;
  vehicleTypes: VehicleType[]; // a corridor is often served by more than one
  color: string;
  bidirectional: boolean;
  geojson: GeoJSON.Feature<GeoJSON.LineString>;
  stops: RouteStop[];
  alternateRoutes?: AlternateRoute[];
  operators?: string[];
  contributor?: string; // credited in the UI via an info icon
  verifiedOn?: string; // ISO date the route was last confirmed on the ground
}
