import { cityBounds, isInsideCity } from "@/lib/city-boundary";
import { withTimeoutSignal } from "@/lib/fetch-timeout";
import type { LngLat } from "@/lib/haversine";

// Photon (photon.komoot.io) — free, unauthenticated, OSM-based geocoder.
// NOT Nominatim: Nominatim sends no Access-Control-Allow-Origin header
// (verified), so a browser fetch to it is CORS-blocked, and this app is a
// static export (output: "export" in next.config.ts) with no API route to
// proxy through. Photon returns barangay-level `district` values for SJDM
// (e.g. "Dulong Bayan", "Gaya-gaya", "Kaypian") that commuters actually
// recognize. See docs/HANDOFF.md §2.
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";
const PHOTON_SEARCH_URL = "https://photon.komoot.io/api";
const SEARCH_RESULT_LIMIT = 6;

// Bias forward search toward SJDM without hard-restricting it (a real
// destination just outside the city, like Sapang Palay Terminal, should
// still be findable) — center of cityBounds' padded bounding box.
const [[minLng, minLat], [maxLng, maxLat]] = cityBounds;
const CITY_CENTER: LngLat = { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 };

// Free shared service — keep requests spaced out rather than firing one per
// pixel of map drag/click. A module-level queue (not per-call debounce)
// because origin and destination can resolve concurrently.
const MIN_REQUEST_INTERVAL_MS = 1000;
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

interface PhotonProperties {
  name?: string;
  street?: string;
  locality?: string;
  district?: string;
}

interface PhotonFeature {
  properties?: PhotonProperties;
  geometry?: { coordinates?: [number, number] }; // GeoJSON Point: [lng, lat]
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export interface PlaceLabel {
  name: string;
  district: string | null;
}

// A forward-search hit — unlike PlaceLabel (naming an already-known point),
// this carries its own coordinates since the whole point of search is
// finding a coordinate the user hasn't picked yet.
export interface PlaceResult {
  name: string;
  coords: LngLat;
  district: string | null;
  isInsideCity: boolean;
}

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
  });
  requestQueue = run.catch(() => {});
  return run.then(fn);
}

/**
 * Reverse-geocodes a point to a human-readable place name via Photon.
 * Returns null on any failure — offline, timeout, no result — never throws.
 * Callers should fall back to showing raw coordinates.
 */
export async function reverseGeocode(
  coords: LngLat,
  signal?: AbortSignal,
): Promise<PlaceLabel | null> {
  return throttle(async () => {
    const url = `${PHOTON_REVERSE_URL}?lat=${coords.lat}&lon=${coords.lng}`;
    const { signal: requestSignal, clear } = withTimeoutSignal(signal);

    try {
      const response = await fetch(url, { signal: requestSignal });
      if (!response.ok) return null;

      const data = (await response.json()) as PhotonResponse;
      const properties = data.features?.[0]?.properties;
      if (!properties) return null;

      const name = properties.name ?? properties.street ?? properties.locality;
      if (!name) return null;

      return { name, district: properties.district ?? null };
    } catch {
      return null;
    } finally {
      clear();
    }
  });
}

/**
 * Forward-searches Photon for a text query, biased toward SJDM but not
 * restricted to it — a real destination just outside the city (e.g. Sapang
 * Palay Terminal) should still be findable. Shares reverseGeocode's request
 * queue/throttle: a free public service shouldn't get one fetch per
 * keystroke just because origin and destination can also be resolving
 * concurrently. Returns [] on any failure — offline, timeout, no result,
 * empty query — never throws.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return throttle(async () => {
    const url =
      `${PHOTON_SEARCH_URL}?q=${encodeURIComponent(trimmed)}` +
      `&lat=${CITY_CENTER.lat}&lon=${CITY_CENTER.lng}&limit=${SEARCH_RESULT_LIMIT}`;
    const { signal: requestSignal, clear } = withTimeoutSignal(signal);

    try {
      const response = await fetch(url, { signal: requestSignal });
      if (!response.ok) return [];

      const data = (await response.json()) as PhotonResponse;
      const results: PlaceResult[] = [];

      for (const feature of data.features ?? []) {
        const properties = feature.properties;
        const coordinates = feature.geometry?.coordinates;
        if (!properties || !coordinates) continue;

        const name = properties.name ?? properties.street ?? properties.locality;
        if (!name) continue;

        const [lng, lat] = coordinates;
        const coords: LngLat = { lng, lat };
        results.push({
          name,
          coords,
          district: properties.district ?? null,
          isInsideCity: isInsideCity([lng, lat]),
        });
      }

      // Inside-city hits first, so a place the user actually recognizes
      // doesn't get buried under same-named results elsewhere.
      return results.sort((a, b) => Number(b.isInsideCity) - Number(a.isInsideCity));
    } catch {
      return [];
    } finally {
      clear();
    }
  });
}
