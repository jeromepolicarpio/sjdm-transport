import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

import type { LngLat } from "@/lib/haversine";

const LOCATE_TIMEOUT_MS = 15_000;

async function ensureLocationPermission(): Promise<boolean> {
  // Capacitor's web implementation of requestPermissions() always throws
  // ("Not implemented on web.") — the browser's own permission prompt is
  // triggered by getCurrentPosition() itself, so on web there's nothing to
  // request up front. Only native Android has a real permission flow here.
  if (!Capacitor.isNativePlatform()) return true;

  const current = await Geolocation.checkPermissions();
  if (current.location === "granted" || current.coarseLocation === "granted") {
    return true;
  }

  const requested = await Geolocation.requestPermissions();
  return requested.location === "granted" || requested.coarseLocation === "granted";
}

// On web, getCurrentPosition() rejects with the raw GeolocationPositionError
// (PERMISSION_DENIED=1, POSITION_UNAVAILABLE=2, TIMEOUT=3) — not an Error
// instance — so callers' `error instanceof Error` narrowing would otherwise
// always miss it and fall back to a generic message. Normalize it here so
// both call sites (locate-control.ts, AppShell's handleUseMyLocation) get an
// actionable one.
function normalizeGeolocationError(error: unknown): Error {
  if (error instanceof Error) return error;

  const code = (error as { code?: number } | null)?.code;
  switch (code) {
    case 1:
      return new Error("Location is blocked for this site — enable it in your browser's site settings");
    case 2:
      return new Error("Your location is unavailable right now");
    case 3:
      return new Error("Timed out getting your location");
    default:
      return new Error("Unable to get your location");
  }
}

// Shared by src/lib/locate-control.ts (the map's own locate button) and
// StartEndBar's "use my location" inputs, so permission handling only lives
// in one place — goes through @capacitor/geolocation for the native Android
// permission dialog, falling back to the browser's own prompt on the web.
export async function getCurrentLngLat(): Promise<LngLat> {
  const granted = await ensureLocationPermission();
  if (!granted) {
    throw new Error("Location permission denied");
  }

  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: LOCATE_TIMEOUT_MS,
    });

    return { lng: position.coords.longitude, lat: position.coords.latitude };
  } catch (error: unknown) {
    throw normalizeGeolocationError(error);
  }
}
