"use client";

import { Loader2, MapPin } from "lucide-react";

import type { FareField, FarePoint } from "@/types/tricycle";

interface FarePickerHintProps {
  origin: FarePoint | null;
  destination: FarePoint | null;
  pickingField: FareField | null;
}

// The pill over the map on the Trike Fare tab — always-on prompt, no
// arm/re-arm button of its own; it just reflects AppShell's pickingField
// (which also accounts for the "Select on Map" override, so the pill still
// shows when re-picking a field that's already set). It takes the color of
// the point being picked: green for the start (matches the origin pin),
// red for the destination (matches the destination pin). Hidden once
// nothing is armed to pick. Mobile-only (md:hidden): on desktop the
// sidebar's FareEmptyState says the same thing inline, so showing both
// would be redundant.
export function FarePickerHint({ origin, destination, pickingField }: FarePickerHintProps) {
  if (origin?.isResolving || destination?.isResolving) {
    const resolvingColor = destination?.isResolving ? "bg-red-600" : "bg-emerald-600";
    return (
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3 md:hidden">
        <div
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full ${resolvingColor} px-4 py-2 text-xs font-semibold text-white shadow-lg`}
        >
          <Loader2 size={14} className="animate-spin" aria-hidden />
          Finding location…
        </div>
      </div>
    );
  }

  if (!pickingField) return null;

  const pillColor = pickingField === "destination" ? "bg-red-600" : "bg-emerald-600";
  const label =
    pickingField === "origin"
      ? "Tap the map to select starting point"
      : "Tap the map to select destination";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3 md:hidden">
      <div
        className={`pointer-events-auto flex items-center gap-1.5 rounded-full ${pillColor} px-4 py-2 text-xs font-semibold text-white shadow-lg`}
      >
        <MapPin size={14} aria-hidden />
        {label}
      </div>
    </div>
  );
}
