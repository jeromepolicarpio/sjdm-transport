"use client";

import { AlertTriangle, Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { formatCoords } from "@/lib/format-coords";
import type {
  FarePoint,
  FareResult,
  GasolinePriceBracket,
  PassengerType,
  TripType,
} from "@/types/tricycle";

export interface FareResultContentProps {
  origin: FarePoint;
  destination: FarePoint;
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

const GASOLINE_BRACKETS: { value: GasolinePriceBracket; label: string }[] = [
  { value: "30-50", label: "₱30–50" },
  { value: "51-70", label: "₱51–70" },
  { value: "71-90", label: "₱71–90" },
  { value: "91-110", label: "₱91–110" },
];

const TRIP_TYPES: { value: TripType; label: string; hint: string }[] = [
  { value: "regular", label: "Regular", hint: "Hailed anywhere, metered by distance" },
  { value: "special", label: "Special", hint: "Exclusive/chartered, to or from a terminal" },
];

const BRACKET_LABEL: Record<GasolinePriceBracket, string> = Object.fromEntries(
  GASOLINE_BRACKETS.map(({ value, label }) => [value, label]),
) as Record<GasolinePriceBracket, string>;

function PointLine({ point, colorClassName }: { point: FarePoint; colorClassName: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-700">
      <MapPin size={14} className={`shrink-0 ${colorClassName}`} aria-hidden />
      {point.isResolving ? (
        <span className="flex items-center gap-1.5 text-slate-500">
          <Loader2 size={12} className="animate-spin" aria-hidden />
          Finding location…
        </span>
      ) : (
        <span className="truncate">{point.label ?? formatCoords(point.coords)}</span>
      )}
    </div>
  );
}

// The body of the fare estimate — points, passenger type, the fare itself,
// and the collapsible gas-price/trip-type settings. No card chrome (header,
// close button, positioning) so it can be reused as-is inside the floating
// mobile FareResultCard and inline in the desktop sidebar's FarePanel.
export function FareResultContent({
  origin,
  destination,
  passengerType,
  onPassengerTypeChange,
  bracket,
  onBracketChange,
  tripType,
  onTripTypeChange,
  result,
  isCalculating,
  onViewFareMatrix,
}: FareResultContentProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isEstimate = result?.distanceSource === "straight_line";

  return (
    <>
      <div className="flex flex-col gap-1.5 px-3 pt-2.5">
        <PointLine point={origin} colorClassName="text-emerald-600" />
        <PointLine point={destination} colorClassName="text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pt-2.5">
        {(["regular", "discounted"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onPassengerTypeChange(type)}
            className={`rounded-md border px-2 py-1.5 text-center text-xs font-semibold capitalize ${
              passengerType === type
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-blue-600 text-blue-600"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="px-3 pt-2.5">
        {isCalculating && (
          <div className="rounded-md border border-slate-200 p-2.5 text-xs text-slate-500">
            Finding route…
          </div>
        )}

        {result && (
          <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {result.tripType === "regular" && (
              <div className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span className="text-slate-500">Road Distance</span>
                <span className="font-medium text-slate-800">
                  {result.distanceKm.toFixed(2)} km
                </span>
              </div>
            )}
            <div className="px-3 py-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Estimated Fare</span>
                <span className="text-lg font-semibold text-blue-700">
                  ₱{result.fare.toFixed(2)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {result.tripType === "regular"
                  ? "Metered by distance."
                  : "Flat special-trip rate."}{" "}
                Legal basis: {result.ordinanceReference}
              </p>
            </div>
          </div>
        )}
      </div>

      {isEstimate && (
        <div className="mx-3 mt-2.5 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Estimate only — routing server unreachable, so this straight-line
            distance is likely lower than the real fare.
          </span>
        </div>
      )}

      <div className="px-3 pt-2.5">
        <button
          type="button"
          onClick={() => setIsSettingsOpen((open) => !open)}
          aria-expanded={isSettingsOpen}
          className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
        >
          <span>
            Gas price {BRACKET_LABEL[bracket]} · {tripType === "regular" ? "Regular" : "Special"} trip
          </span>
          {isSettingsOpen ? (
            <ChevronUp size={14} className="shrink-0" aria-hidden />
          ) : (
            <ChevronDown size={14} className="shrink-0" aria-hidden />
          )}
        </button>

        {isSettingsOpen && (
          <div className="mt-2 flex flex-col gap-2.5">
            <fieldset>
              <legend className="mb-1 text-xs font-medium text-slate-500">
                Gasoline price (per liter)
              </legend>
              <div className="grid grid-cols-4 gap-1">
                {GASOLINE_BRACKETS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-md border px-1 py-1.5 text-center text-xs font-medium ${
                      bracket === value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bracket"
                      value={value}
                      checked={bracket === value}
                      onChange={() => onBracketChange(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-xs font-medium text-slate-500">Trip type</legend>
              <div className="grid grid-cols-2 gap-1">
                {TRIP_TYPES.map(({ value, label, hint }) => (
                  <label
                    key={value}
                    title={hint}
                    className={`cursor-pointer rounded-md border px-2 py-1.5 text-center text-xs font-medium ${
                      tripType === value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tripType"
                      value={value}
                      checked={tripType === value}
                      onChange={() => onTripTypeChange(value)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </div>

      <p className="px-3 py-3 text-xs text-slate-500">
        Uses the last officially published fare schedule (2022).{" "}
        <button
          type="button"
          onClick={onViewFareMatrix}
          className="underline underline-offset-2 hover:text-slate-700"
        >
          View the fare matrix
        </button>
      </p>
    </>
  );
}
