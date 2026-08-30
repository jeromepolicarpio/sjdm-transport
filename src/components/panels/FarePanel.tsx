"use client";

import { FareEmptyState } from "@/components/FareEmptyState";
import {
  DESTINATION_COLOR_CLASS,
  DESTINATION_ICON,
  FarePointRow,
  ORIGIN_COLOR_CLASS,
  ORIGIN_ICON,
} from "@/components/FarePointRow";
import { FareResultContent } from "@/components/FareResultContent";
import { PlacePickerMenu } from "@/components/PlacePickerMenu";
import type { LngLat } from "@/lib/haversine";
import type {
  FareField,
  FarePoint,
  FareResult,
  GasolinePriceBracket,
  PassengerType,
  TripType,
} from "@/types/tricycle";

interface FarePanelProps {
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
  passengerType: PassengerType;
  onPassengerTypeChange: (passengerType: PassengerType) => void;
  bracket: GasolinePriceBracket;
  onBracketChange: (bracket: GasolinePriceBracket) => void;
  tripType: TripType;
  onTripTypeChange: (tripType: TripType) => void;
  result: FareResult | null;
  isCalculating: boolean;
  onViewFareMatrix: () => void;
}

// Desktop sidebar body for the Trike Fare tab — the same origin/destination
// rows as the mobile StartEndBar plus the same result content as the mobile
// FareResultCard, just composed inline instead of as a bar + floating card.
// All state is lifted into AppShell (see AppShell.tsx's comment on why),
// so this being mounted alongside the mobile surfaces at the same time is
// safe: no fetching happens here, and only one PlacePickerMenu (shared
// openPickerField) can be open across both surfaces at once.
export function FarePanel({
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
  passengerType,
  onPassengerTypeChange,
  bracket,
  onBracketChange,
  tripType,
  onTripTypeChange,
  result,
  isCalculating,
  onViewFareMatrix,
}: FarePanelProps) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div>
        <FarePointRow
          placeholder="Choose starting point…"
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
          />
        )}
      </div>
      <div>
        <FarePointRow
          placeholder="Choose destination…"
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
          />
        )}
      </div>
      {locateError && <p className="px-1 text-xs text-red-600">{locateError}</p>}

      {origin && destination ? (
        <div className="-mx-3 mt-1 border-t border-slate-100">
          <FareResultContent
            origin={origin}
            destination={destination}
            passengerType={passengerType}
            onPassengerTypeChange={onPassengerTypeChange}
            bracket={bracket}
            onBracketChange={onBracketChange}
            tripType={tripType}
            onTripTypeChange={onTripTypeChange}
            result={result}
            isCalculating={isCalculating}
            onViewFareMatrix={onViewFareMatrix}
          />
        </div>
      ) : (
        <FareEmptyState hasOrigin={!!origin} />
      )}
    </div>
  );
}
