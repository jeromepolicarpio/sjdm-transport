"use client";

import type { Ref } from "react";

import { X } from "lucide-react";

import { FareResultContent } from "@/components/FareResultContent";
import type { FareResultContentProps } from "@/components/FareResultContent";

interface FareResultCardProps extends FareResultContentProps {
  onClose: () => void;
  // Lets AppShell measure the card's actual rendered height (it has no
  // fixed height — max-h-[60vh] and content-dependent) so CityMap's
  // frameFareTrip can pad the camera fit by exactly how much of the map
  // this card covers, instead of guessing a constant that drifts out of
  // sync with the content. Zero on desktop (md:hidden collapses it to no
  // layout box), which is what we want there too.
  ref?: Ref<HTMLDivElement>;
}

// Floating card that surfaces once both fare points are plotted — modeled on
// GenSan Transport's fare-estimate card. Mobile-only (md:hidden): on desktop
// the same FareResultContent renders inline in the sidebar's FarePanel
// instead, with no card chrome and no close button (clearing a point is done
// via its FarePointRow's clear button there).
export function FareResultCard({ onClose, ref, ...contentProps }: FareResultCardProps) {
  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg md:hidden"
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <span className="text-sm font-semibold text-slate-800">Fare Estimate</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close fare estimate"
          className="flex h-10 w-10 items-center justify-center rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <FareResultContent {...contentProps} />
    </div>
  );
}
