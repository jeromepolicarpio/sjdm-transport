import { puvRoutes } from "@/data/puv-routes";

// Single source of truth for route line colors, so a new route can be
// checked for a collision before it ships (docs/PROGRESS.md Phase 3 already
// records one collision that slipped through — licao-licao-muzon-sm-sjdm vs
// muzon-sm-sjdm, both #16a34a, later recolored).
export function assertNoRoutePaletteCollision(): void {
  const seen = new Map<string, string>();

  for (const route of puvRoutes) {
    const existingRouteId = seen.get(route.color);
    if (existingRouteId) {
      throw new Error(
        `Route color collision: "${route.id}" and "${existingRouteId}" both use ${route.color}`,
      );
    }
    seen.set(route.color, route.id);
  }
}

if (process.env.NODE_ENV !== "production") {
  assertNoRoutePaletteCollision();
}
