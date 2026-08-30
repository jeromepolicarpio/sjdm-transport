"use client";

import { Loader2, MapPin, Navigation, X } from "lucide-react";

import { formatCoords } from "@/lib/format-coords";
import type { FarePoint } from "@/types/tricycle";

interface FarePointRowProps {
  placeholder: string;
  icon: typeof MapPin;
  colorClassName: string;
  point: FarePoint | null;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onClear: () => void;
}

// One origin/destination row: label icon, resolved place name (or a
// "Finding…" spinner while snap/reverse-geocode is in flight), a clear
// button once set, and — the row itself — a trigger for PlacePickerMenu
// (Current Location / Select on Map / places). Shared by StartEndBar
// (horizontal pills under the header, mobile) and FarePanel (stacked rows
// in the desktop sidebar) so the two surfaces can't drift.
export function FarePointRow({
  placeholder,
  icon: Icon,
  colorClassName,
  point,
  isMenuOpen,
  onToggleMenu,
  onClear,
}: FarePointRowProps) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-1 rounded-full border bg-white pl-1 pr-1.5 ${
        isMenuOpen ? "border-blue-600" : "border-slate-300"
      }`}
    >
      <button
        type="button"
        onClick={onToggleMenu}
        aria-haspopup="listbox"
        aria-expanded={isMenuOpen}
        aria-label={point ? `Change ${placeholder.replace("…", "")}` : `Choose ${placeholder.replace("…", "")}`}
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-2 py-2 text-left"
      >
        <Icon size={16} className={`shrink-0 ${colorClassName}`} aria-hidden />

        {!point && (
          <span className="min-w-0 flex-1 truncate text-sm text-slate-400">{placeholder}</span>
        )}
        {point?.isResolving && (
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm text-slate-500">
            <Loader2 size={12} className="animate-spin shrink-0" aria-hidden />
            Finding…
          </span>
        )}
        {point && !point.isResolving && (
          <span className="min-w-0 flex-1 truncate text-sm text-slate-800">
            {point.label ?? formatCoords(point.coords)}
          </span>
        )}
      </button>

      {point && (
        <button
          type="button"
          onClick={onClear}
          title="Clear"
          aria-label="Clear"
          className="flex shrink-0 items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}

// Re-exported so both consumers use the same icon/color pairing for origin
// vs destination instead of redeclaring it twice.
export const ORIGIN_ICON = MapPin;
export const DESTINATION_ICON = Navigation;
export const ORIGIN_COLOR_CLASS = "text-emerald-600";
export const DESTINATION_COLOR_CLASS = "text-red-600";
