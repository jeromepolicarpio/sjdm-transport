"use client";

import { ArrowLeftRight, ListFilter, X } from "lucide-react";
import { useState } from "react";

interface MapLegendProps {
  darkOverlay: boolean;
  onToggleDarkOverlay: (value: boolean) => void;
}

// Explains what src/lib/route-layers.ts already draws — line weight/opacity
// and stop-circle radius carry real meaning (docs/HANDOFF.md §3b) that was
// previously never surfaced to the user.
export function MapLegend({ darkOverlay, onToggleDarkOverlay }: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Show map legend"
        className="pointer-events-auto absolute bottom-3 left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow dark:bg-slate-900 dark:text-slate-200"
      >
        <ListFilter size={18} aria-hidden />
      </button>
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-10 w-56 rounded-md bg-white p-3 text-xs shadow dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          Legend
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Hide map legend"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded bg-slate-500" aria-hidden />
          Route inside SJDM
        </li>
        <li className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded bg-slate-400 opacity-50" aria-hidden />
          Route outside the city
        </li>
        <li className="flex items-center gap-2">
          <span
            className="h-0.5 w-5 rounded bg-slate-500"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, currentColor 0 3px, transparent 3px 6px)",
              backgroundColor: "transparent",
            }}
            aria-hidden
          />
          Alternate routing
        </li>
        <li className="flex items-center gap-2">
          <ArrowLeftRight size={12} aria-hidden />
          Stop shared by routes (larger, ringed)
        </li>
      </ul>

      <label className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2 text-slate-700 dark:border-slate-800 dark:text-slate-200">
        <input
          type="checkbox"
          checked={darkOverlay}
          onChange={(event) => onToggleDarkOverlay(event.target.checked)}
        />
        Dark overlay
      </label>
    </div>
  );
}
