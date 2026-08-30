import type { LngLat } from "@/lib/haversine";

// Fallback label for a fare point that resolved coordinates but no place
// name (offline, or Photon found nothing) — shared by StartEndBar and
// FareResultCard.
export function formatCoords(coords: LngLat): string {
  return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
}
