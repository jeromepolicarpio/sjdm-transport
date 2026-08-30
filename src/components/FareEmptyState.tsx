import { MapPin, Navigation } from "lucide-react";

interface FareEmptyStateProps {
  hasOrigin: boolean;
}

// Desktop-only illustrated prompt shown in the sidebar panel before both
// fare points are picked — the origin/destination circle pair, matching the
// reference layout. Mirrors what FarePickerHint already says over the map
// on mobile (that pill is md:hidden, so the two never say it twice).
export function FareEmptyState({ hasOrigin }: FareEmptyStateProps) {
  const heading = hasOrigin ? "Select your destination" : "Select your starting point";

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
      <div className="flex items-center gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-2 ring-emerald-500">
          <MapPin size={18} className="text-emerald-600" aria-hidden />
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          <span className="h-px w-6 border-t border-dashed border-slate-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="h-px w-6 border-t border-dashed border-slate-300" />
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
          <Navigation size={18} className="text-red-500" aria-hidden />
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">{heading}</p>
        <p className="mt-1 text-xs text-slate-500">Click on the map to drop a pin</p>
      </div>
    </div>
  );
}
