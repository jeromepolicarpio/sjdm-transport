"use client";

import { Marker } from "maplibre-gl";
import type { ControlPosition, IControl, Map as MapLibreMap } from "maplibre-gl";

import { getCurrentLngLat } from "@/lib/geolocate";

const LABEL_IDLE = "Show my location";
const LABEL_LOCATING = "Locating…";
const ICON_IDLE = "📍";
const ICON_ERROR = "⚠️";
const USER_MARKER_COLOR = "#2563eb";
const FLY_TO_ZOOM = 15;
// title/aria-label alone are invisible on a touchscreen (no hover) — the
// icon swap alone had the same problem (a wordless ⚠️ doesn't say what went
// wrong), so a visible text bubble backs it up here too.
const ERROR_ICON_DURATION_MS = 4_000;

// Custom maplibre-gl control (rather than the built-in GeolocateControl) so
// permission handling goes through @capacitor/geolocation — required for the
// native Android permission dialog; falls back to the browser's own prompt
// when running as a plain web page.
export class LocateControl implements IControl {
  private map: MapLibreMap | null = null;
  private container: HTMLDivElement | null = null;
  private button: HTMLButtonElement | null = null;
  private errorBubble: HTMLDivElement | null = null;
  private marker: Marker | null = null;

  onAdd(map: MapLibreMap): HTMLElement {
    this.map = map;

    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.container.style.position = "relative";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.title = LABEL_IDLE;
    this.button.setAttribute("aria-label", LABEL_IDLE);
    this.button.textContent = ICON_IDLE;
    this.button.addEventListener("click", () => {
      void this.locate();
    });

    // Visible text bubble for errors — the icon swap alone is silent about
    // *what* went wrong, and title/aria-label need hover, which a touch
    // screen never provides. Stays in the layout at all times (toggling
    // opacity/visibility, not display:none/block): a role="status" region
    // that's inserted into the DOM and given text in the same tick is
    // unreliable for screen readers to announce — an always-present live
    // region whose text content merely *changes* is the pattern that
    // actually gets picked up.
    this.errorBubble = document.createElement("div");
    this.errorBubble.setAttribute("role", "status");
    this.errorBubble.style.cssText =
      "opacity:0;visibility:hidden;transition:opacity 150ms ease-out;" +
      "position:absolute;top:0;right:calc(100% + 6px);max-width:200px;" +
      "background:#1e293b;color:#fff;font-size:12px;line-height:1.3;padding:6px 10px;" +
      "border-radius:6px;white-space:normal;box-shadow:0 1px 4px rgba(0,0,0,0.3);";

    this.container.appendChild(this.button);
    this.container.appendChild(this.errorBubble);
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.marker?.remove();
    this.map = null;
    this.container = null;
    this.button = null;
    this.errorBubble = null;
  }

  getDefaultPosition(): ControlPosition {
    return "top-right";
  }

  private async locate(): Promise<void> {
    if (!this.map || !this.button) return;

    this.button.disabled = true;
    this.button.title = LABEL_LOCATING;
    this.button.setAttribute("aria-label", LABEL_LOCATING);

    try {
      const { lng, lat } = await getCurrentLngLat();
      const lngLat: [number, number] = [lng, lat];

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
      if (this.errorBubble) {
        this.errorBubble.textContent = message;
        this.errorBubble.style.visibility = "visible";
        this.errorBubble.style.opacity = "1";
      }
      setTimeout(() => {
        if (this.button) {
          this.button.textContent = ICON_IDLE;
          this.button.title = LABEL_IDLE;
          this.button.setAttribute("aria-label", LABEL_IDLE);
        }
        if (this.errorBubble) {
          this.errorBubble.style.opacity = "0";
          this.errorBubble.style.visibility = "hidden";
        }
      }, ERROR_ICON_DURATION_MS);
    } finally {
      this.button.disabled = false;
    }
  }
}
