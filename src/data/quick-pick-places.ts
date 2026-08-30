import { puvRoutes } from "@/data/puv-routes";
import type { LngLat } from "@/lib/haversine";

export interface QuickPickPlace {
  name: string;
  coords: LngLat;
  isOutsideCity: boolean;
}

// Derived, not authored: docs/HANDOFF.md §7 marks standalone landmarks as
// "Manual + OSM — Not started", and this project's rule is that unverified
// place data is worse than missing data. But every PUV route stop in
// puv-routes.ts is already a real, field-checked coordinate (see that
// file's header comment) — so the fare picker's quick-pick list is built by
// deduping those stops instead of transcribing a second, parallel list that
// could drift from the route data or get authored from memory. Verifying
// another route later grows this list for free.
export const quickPickPlaces: QuickPickPlace[] = (() => {
  const byName = new Map<string, QuickPickPlace>();

  for (const route of puvRoutes) {
    for (const stop of route.stops) {
      if (byName.has(stop.name)) continue;
      byName.set(stop.name, {
        name: stop.name,
        coords: { lng: stop.coords[0], lat: stop.coords[1] },
        isOutsideCity: stop.isOutsideCity,
      });
    }
  }

  return [...byName.values()];
})();
