"use client";

import {
  DESTINATION_COLOR_CLASS,
  DESTINATION_ICON,
  FarePointRow,
  ORIGIN_COLOR_CLASS,
  ORIGIN_ICON,
} from "@/components/FarePointRow";
import { PlacePickerMenu } from "@/components/PlacePickerMenu";
import type { LngLat } from "@/lib/haversine";
import type { FareField, FarePoint } from "@/types/tricycle";

interface StartEndBarProps {
  origin: FarePoint | null;
  destination: FarePoint | null;
  openPickerField: FareField | null;
  onTogglePicker: (field: FareField) => void;
  onClosePicker: () => void;
  onUseCurrentLocation: (field: FareField) => void;
  onSelectOnMap: (field: FareField) => void;
  onSelectPlace: (field: FareField, name: string, coords: LngLat) => void;
  onClearPoint: (field: FareField) => void;
  isOnline: boolean;
  locateError: string | null;
}

// Start/End row above the map — modeled directly on GenSan Transport's
// layout. Each row opens a PlacePickerMenu (Current Location / Select on
// Map / places) instead of a bare crosshair. Mobile-only (md:hidden) — the
// desktop sidebar shows the same rows via FarePanel/FarePointRow instead.
// All state (which menu is open, the picking override, locateError) is
// lifted into AppShell since this and FarePanel are mounted simultaneously.
export function StartEndBar({
  origin,
  destination,
  openPickerField,
  onTogglePicker,
  onClosePicker,
  onUseCurrentLocation,
  onSelectOnMap,
  onSelectPlace,
  onClearPoint,
  isOnline,
  locateError,
}: StartEndBarProps) {
  return (
    <div className="relative z-30 flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white p-2 md:hidden">
      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <FarePointRow
            placeholder="Start…"
            icon={ORIGIN_ICON}
            colorClassName={ORIGIN_COLOR_CLASS}
            point={origin}
            isMenuOpen={openPickerField === "origin"}
            onToggleMenu={() => onTogglePicker("origin")}
            onClear={() => onClearPoint("origin")}
          />
          {openPickerField === "origin" && (
            <PlacePickerMenu
              field="origin"
              onClose={onClosePicker}
              onUseCurrentLocation={() => onUseCurrentLocation("origin")}
              onSelectOnMap={() => onSelectOnMap("origin")}
              onSelectPlace={(name, coords) => onSelectPlace("origin", name, coords)}
              isOnline={isOnline}
              className="absolute inset-x-0 top-full mt-1.5"
            />
          )}
        </div>
        <div className="relative min-w-0 flex-1">
          <FarePointRow
            placeholder="End…"
            icon={DESTINATION_ICON}
            colorClassName={DESTINATION_COLOR_CLASS}
            point={destination}
            isMenuOpen={openPickerField === "destination"}
            onToggleMenu={() => onTogglePicker("destination")}
            onClear={() => onClearPoint("destination")}
          />
          {openPickerField === "destination" && (
            <PlacePickerMenu
              field="destination"
              onClose={onClosePicker}
              onUseCurrentLocation={() => onUseCurrentLocation("destination")}
              onSelectOnMap={() => onSelectOnMap("destination")}
              onSelectPlace={(name, coords) => onSelectPlace("destination", name, coords)}
              isOnline={isOnline}
              className="absolute inset-x-0 top-full mt-1.5"
            />
          )}
        </div>
      </div>
      {locateError && <p className="px-1 text-xs text-red-600">{locateError}</p>}
    </div>
  );
}
