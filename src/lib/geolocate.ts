import { Geolocation } from "@capacitor/geolocation";

import type { LngLat } from "@/lib/haversine";

const LOCATE_TIMEOUT_MS = 15_000;

async function ensureLocationPermission(): Promise<boolean> {
  const current = await Geolocation.checkPermissions();
  if (current.location === "granted" || current.coarseLocation === "granted") {
    return true;
  }

  const requested = await Geolocation.requestPermissions();
  return requested.location === "granted" || requested.coarseLocation === "granted";
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

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: LOCATE_TIMEOUT_MS,
  });

  return { lng: position.coords.longitude, lat: position.coords.latitude };
}
