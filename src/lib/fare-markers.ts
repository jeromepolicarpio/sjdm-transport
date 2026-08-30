import { Marker } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { FarePoint } from "@/types/tricycle";

export type FareMarkerVariant = "origin" | "destination";

// Drawn size of the pin SVG below — exported so CityMap's frameFareTrip
// padding (which must clear the pin's full height above its anchor point)
// derives from the same number instead of hardcoding a second "44" that
// could silently drift out of sync with this one.
export const FARE_MARKER_PIN_PX = 44;

const VARIANT_COLOR: Record<FareMarkerVariant, string> = {
  origin: "#16a34a",
  destination: "#dc2626",
};

// Same outline as lucide-react's "map-pin" icon (used elsewhere in this app
// — see StartEndBar.tsx), reproduced as a plain SVG string because MapLibre
// Markers take a DOM element, not a React node. Filled + white-stroked
// rather than lucide's default outline style, for visibility against both
// the raster OSM basemap and the offline vector style's beige background.
function pinSvg(color: string): string {
  return `
    <svg class="fare-marker-pin" width="${FARE_MARKER_PIN_PX}" height="${FARE_MARKER_PIN_PX}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
            fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="12" cy="10" r="3" fill="#ffffff"/>
    </svg>
  `;
}

// Structure: root (positioned by MapLibre via anchor:"bottom" — must stay
// untransformed so the pin tip lands exactly on the coordinate) > animated
// inner wrapper (just the pin — the place name/district is shown in
// StartEndBar/FareResultCard instead, not repeated as an on-map label).
function createMarkerElement(variant: FareMarkerVariant): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "fare-marker";

  const inner = document.createElement("div");
  inner.className = "fare-marker-inner fare-marker-drop";
  inner.innerHTML = pinSvg(VARIANT_COLOR[variant]);
  // The drop animation only needs to play once per pin — remove the class
  // afterward so a later, unrelated reflow can't replay it.
  inner.addEventListener(
    "animationend",
    () => inner.classList.remove("fare-marker-drop"),
    { once: true },
  );

  root.appendChild(inner);
  return root;
}

function updateMarkerState(el: HTMLElement, point: FarePoint): void {
  const inner = el.querySelector<HTMLElement>(".fare-marker-inner");
  inner?.classList.toggle("fare-marker-resolving", point.isResolving);
}

/**
 * Creates, moves, updates, or removes a single origin/destination marker to
 * match `point`. Returns the marker instance to hold onto (or null once
 * removed) — callers keep this in a ref since "moves" reuse the existing
 * DOM element rather than tearing down and rebuilding it every render.
 *
 * `existing` is only reused if its element is still actually attached to
 * the DOM (`.isConnected`) — a caller that failed to null its ref after
 * removing a marker (e.g. on unmount) would otherwise hand back a detached
 * element here, which `setLngLat` on a never-added Marker silently no-ops.
 */
export function syncFareMarker(
  map: MapLibreMap,
  existing: Marker | null,
  point: FarePoint | null,
  variant: FareMarkerVariant,
): Marker | null {
  if (!point) {
    existing?.remove();
    return null;
  }

  const reusable = existing && existing.getElement().isConnected;
  const marker = reusable
    ? existing!
    : new Marker({ element: createMarkerElement(variant), anchor: "bottom" });

  // setLngLat before addTo, not after: addTo() triggers MapLibre's internal
  // _update(), which reads the marker's current lngLat to position it — on
  // a brand-new Marker that hasn't had setLngLat called yet, that crashes
  // reading .lng off an unset coordinate. (Reusing an already-added marker
  // doesn't hit this path, which is why this only broke new pins.)
  marker.setLngLat([point.coords.lng, point.coords.lat]);
  if (!reusable) marker.addTo(map);

  updateMarkerState(marker.getElement(), point);

  return marker;
}
