"use client";

import { Loader2, LocateFixed, Map, MapPin, Navigation, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { quickPickPlaces } from "@/data/quick-pick-places";
import { useDismiss } from "@/lib/use-dismiss";
import type { LngLat } from "@/lib/haversine";
import { searchPlaces } from "@/lib/photon";
import type { PlaceResult } from "@/lib/photon";
import type { FareField } from "@/types/tricycle";

interface PlacePickerMenuProps {
  field: FareField;
  onClose: () => void;
  onUseCurrentLocation: () => void;
  onSelectOnMap: () => void;
  onSelectPlace: (name: string, coords: LngLat) => void;
  isOnline: boolean;
  /** Positioning classes for the menu's root. Defaults to in-flow spacing
   *  (the desktop sidebar mount, which sits inside an overflow-y-auto
   *  clipper and cannot host a floating overlay). StartEndBar's mobile
   *  mount passes anchored-overlay classes instead — see the comment below. */
  className?: string;
}

const SEARCH_DEBOUNCE_MS = 350;

// Plain buttons, not role="option" inside role="listbox" — that ARIA
// pattern requires arrow-key roving focus and aria-activedescendant to
// behave correctly, which this menu (tab-stop buttons) doesn't implement.
// A half-built listbox announces semantics screen readers can't actually
// use, which is worse than none — see the heuristic audit, 2026-08-30.
function MenuOption({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

// Dropdown opened by clicking a FarePointRow — Current Location, Select on
// Map, then real places: the field-relevant PUV stop list (no network, no
// invented data — see quick-pick-places.ts) plus live Photon search results
// once the user types. Positioning is caller-supplied via `className`
// because the two mount points need opposite treatments: the desktop
// sidebar (FarePanel) sits inside AppShell's overflow-y-auto panel, which
// would clip an absolute popover, so it stays in-flow (the default below).
// StartEndBar's mobile mount has no clipping ancestor — there the menu is
// anchored absolutely to its triggering pill so it overlays the map instead
// of pushing it down; see StartEndBar.tsx for that className.
export function PlacePickerMenu({
  field,
  onClose,
  onUseCurrentLocation,
  onSelectOnMap,
  onSelectPlace,
  isOnline,
  className = "mt-1.5",
}: PlacePickerMenuProps) {
  const [query, setQuery] = useState("");
  // Keyed rather than a plain results array — same reasoning as AppShell's
  // `computed`: lets `results`/`isSearching` below be *derived* (does the
  // stored key match this render's query?) instead of a separate loading
  // flag set synchronously at the top of the effect, which react-hooks
  // flags as a same-render cascade. Setting state only from the debounced
  // .then callback also clears stale results for free — an edited query
  // stops matching with no explicit reset branch needed.
  const [search, setSearch] = useState<{ key: string; results: PlaceResult[] } | null>(null);
  const dismissRef = useDismiss<HTMLDivElement>(true, onClose);

  const FieldIcon = field === "origin" ? MapPin : Navigation;
  const fieldIconColor = field === "origin" ? "text-emerald-600" : "text-red-600";

  const trimmedQuery = query.trim();
  const searchKey = trimmedQuery && isOnline ? trimmedQuery : null;
  const results = searchKey && search?.key === searchKey ? search.results : [];
  const isSearching = searchKey !== null && search?.key !== searchKey;

  useEffect(() => {
    if (!searchKey) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(searchKey, controller.signal).then((found) => {
        if (!controller.signal.aborted) setSearch({ key: searchKey, results: found });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchKey]);

  const filteredQuickPicks = trimmedQuery
    ? quickPickPlaces.filter((place) =>
        place.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : quickPickPlaces;

  return (
    <div
      ref={dismissRef}
      role="group"
      aria-label={field === "origin" ? "Choose starting point" : "Choose destination"}
      className={`${className} max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg transition-[opacity,transform] duration-150 ease-out starting:-translate-y-1 starting:opacity-0`}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <Search size={15} className="shrink-0 text-slate-400" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a place…"
          disabled={!isOnline}
          autoFocus
          className="min-w-0 flex-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
        />
        {isSearching && (
          <Loader2 size={14} className="shrink-0 animate-spin text-slate-400" aria-hidden />
        )}
      </div>
      {!isOnline && (
        <p className="border-b border-slate-100 px-3 py-1.5 text-xs text-slate-400">
          Search needs a connection — offline picks below still work.
        </p>
      )}

      <div className="py-1">
        <MenuOption
          onClick={() => {
            onUseCurrentLocation();
            onClose();
          }}
        >
          <LocateFixed size={16} className="shrink-0 text-blue-600" aria-hidden />
          <span className="font-medium text-blue-700">Current Location</span>
        </MenuOption>
        <MenuOption
          onClick={() => {
            onSelectOnMap();
            onClose();
          }}
        >
          <Map size={16} className="shrink-0 text-blue-600" aria-hidden />
          <span className="font-medium text-blue-700">Select on Map</span>
        </MenuOption>
      </div>

      {filteredQuickPicks.length > 0 && (
        <div className="border-t border-slate-100 py-1">
          {filteredQuickPicks.map((place) => (
            <MenuOption
              key={place.name}
              onClick={() => {
                onSelectPlace(place.name, place.coords);
                onClose();
              }}
            >
              <FieldIcon size={16} className={`shrink-0 ${fieldIconColor}`} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-slate-700">
                {place.name}
                {place.isOutsideCity && (
                  <span className="ml-1 text-xs text-slate-400">(outside city)</span>
                )}
              </span>
            </MenuOption>
          ))}
        </div>
      )}

      {trimmedQuery && results.length > 0 && (
        <div className="border-t border-slate-100 py-1">
          {results.map((result) => (
            <MenuOption
              key={`${result.name}-${result.coords.lng}-${result.coords.lat}`}
              onClick={() => {
                onSelectPlace(result.name, result.coords);
                onClose();
              }}
            >
              <FieldIcon
                size={16}
                className={`shrink-0 ${result.isInsideCity ? fieldIconColor : "text-slate-300"}`}
                aria-hidden
              />
              <span
                className={`min-w-0 flex-1 truncate ${result.isInsideCity ? "text-slate-700" : "text-slate-400"}`}
              >
                {result.name}
              </span>
            </MenuOption>
          ))}
        </div>
      )}

      {trimmedQuery && !isSearching && filteredQuickPicks.length === 0 && results.length === 0 && (
        <p className="border-t border-slate-100 px-3 py-3 text-center text-xs text-slate-400">
          No places found.
        </p>
      )}
    </div>
  );
}
