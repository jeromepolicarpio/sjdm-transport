"use client";

import { Geolocation } from "@capacitor/geolocation";
import { Marker } from "maplibre-gl";
import type { ControlPosition, IControl, Map as MapLibreMap } from "maplibre-gl";

const LABEL_IDLE = "Show my location";
const LABEL_LOCATING = "Locating…";
const ICON_IDLE = "📍";
const ICON_ERROR = "⚠️";
const USER_MARKER_COLOR = "#2563eb";
const FLY_TO_ZOOM = 15;
const LOCATE_TIMEOUT_MS = 15_000;
// title/aria-label alone are invisible on a touchscreen (no hover) — swap
// the icon so a failure is visible without a toast library, then revert.
const ERROR_ICON_DURATION_MS = 4_000;

// Custom maplibre-gl control (rather than the built-in GeolocateControl) so
// permission handling goes through @capacitor/geolocation — required for the
// native Android permission dialog; falls back to the browser's own prompt
// when running as a plain web page.
export class LocateControl implements IControl {
  private map: MapLibreMap | null = null;
  private container: HTMLDivElement | null = null;
  private button: HTMLButtonElement | null = null;
  private marker: Marker | null = null;

  onAdd(map: MapLibreMap): HTMLElement {
    this.map = map;

    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.title = LABEL_IDLE;
    this.button.setAttribute("aria-label", LABEL_IDLE);
    this.button.textContent = ICON_IDLE;
    this.button.addEventListener("click", () => {
      void this.locate();
    });

    this.container.appendChild(this.button);
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.marker?.remove();
    this.map = null;
    this.container = null;
    this.button = null;
  }

  getDefaultPosition(): ControlPosition {
    return "top-right";
  }

  private async ensurePermission(): Promise<boolean> {
    const current = await Geolocation.checkPermissions();
    if (current.location === "granted" || current.coarseLocation === "granted") {
      return true;
    }

    const requested = await Geolocation.requestPermissions();
    return requested.location === "granted" || requested.coarseLocation === "granted";
  }

  private async locate(): Promise<void> {
    if (!this.map || !this.button) return;

    this.button.disabled = true;
    this.button.title = LABEL_LOCATING;
    this.button.setAttribute("aria-label", LABEL_LOCATING);

    try {
      const granted = await this.ensurePermission();
      if (!granted) {
        throw new Error("Location permission denied");
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: LOCATE_TIMEOUT_MS,
      });
      const lngLat: [number, number] = [position.coords.longitude, position.coords.latitude];

      if (this.marker) {
        this.marker.setLngLat(lngLat);
      } else {
        this.marker = new Marker({ color: USER_MARKER_COLOR }).setLngLat(lngLat).addTo(this.map);
      }

      this.map.flyTo({ center: lngLat, zoom: FLY_TO_ZOOM });
      this.button.title = LABEL_IDLE;
      this.button.setAttribute("aria-label", LABEL_IDLE);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to get location";
      this.button.title = message;
      this.button.setAttribute("aria-label", message);
      this.button.textContent = ICON_ERROR;
      setTimeout(() => {
        if (!this.button) return;
        this.button.textContent = ICON_IDLE;
        this.button.title = LABEL_IDLE;
        this.button.setAttribute("aria-label", LABEL_IDLE);
      }, ERROR_ICON_DURATION_MS);
    } finally {
      this.button.disabled = false;
    }
  }
}
