"use client";

import { ArrowLeftRight, Info } from "lucide-react";
import { useState } from "react";

import type { PuvRoute, RouteStop, VehicleType } from "@/types/puv-route";

interface RoutesPanelProps {
  routes: PuvRoute[];
  visibleRouteIds: ReadonlySet<string>;
  onToggleRoute: (routeId: string) => void;
  onStopSelect: (stop: RouteStop) => void;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
}

const VEHICLE_LABELS: Record<VehicleType, string> = {
  bus: "Bus",
  jeepney: "Jeepney",
  modern_jeepney: "Modern jeepney",
};

// PUV routes change without notice (docs/HANDOFF.md §9) — a route that
// hasn't been re-checked recently should read as possibly stale, not as
// current just because it has *some* verifiedOn date.
const STALE_AFTER_DAYS = 180;

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

function StalenessNote({ verifiedOn }: { verifiedOn?: string }) {
  if (!verifiedOn) {
    return (
      <span className="text-amber-700 dark:text-amber-400">
        not yet verified on the ground
      </span>
    );
  }

  const isStale = daysSince(verifiedOn) > STALE_AFTER_DAYS;

  return (
    <span className={isStale ? "text-amber-700 dark:text-amber-400" : undefined}>
      verified {verifiedOn}
      {isStale && " (possibly outdated)"}
    </span>
  );
}

export function RoutesPanel({
  routes,
  visibleRouteIds,
  onToggleRoute,
  onStopSelect,
  selectedRouteId,
  onSelectRoute,
}: RoutesPanelProps) {
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [contributorPopoverId, setContributorPopoverId] = useState<string | null>(null);

  if (routes.length === 0) {
    return (
      <p className="p-3 text-sm text-slate-600 dark:text-slate-300">
        No routes yet — PUV corridors are field-surveyed and GPS-logged before
        they ship here (see docs/HANDOFF.md §7). Check back once the first
        route is verified.
      </p>
    );
  }

  return (
    <ul className="space-y-2 p-3 text-sm">
      {routes.map((route) => {
        const isVisible = visibleRouteIds.has(route.id);
        const isExpanded = expandedRouteId === route.id;
        const isSelected = selectedRouteId === route.id;

        return (
          <li
            key={route.id}
            className={`rounded-md border-b border-slate-100 pb-2 last:border-b-0 dark:border-slate-800 ${
              isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
            }`}
          >
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleRoute(route.id)}
                aria-label={`Show ${route.name} on the map`}
              />
              <span
                className="h-3 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: route.color }}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => {
                  const nextExpanded = isExpanded ? null : route.id;
                  setExpandedRouteId(nextExpanded);
                  onSelectRoute(isSelected ? null : route.id);
                }}
                aria-expanded={isExpanded}
                aria-pressed={isSelected}
                className="flex-1 text-left font-medium text-slate-800 dark:text-slate-100"
              >
                {route.name}
              </button>
              {route.contributor && (
                <button
                  type="button"
                  onClick={() =>
                    setContributorPopoverId(
                      contributorPopoverId === route.id ? null : route.id,
                    )
                  }
                  aria-expanded={contributorPopoverId === route.id}
                  aria-label={`Source info for ${route.name}`}
                  className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Info size={14} aria-hidden />
                </button>
              )}
            </div>

            {contributorPopoverId === route.id && route.contributor && (
              <p className="ml-6 mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {route.contributor}
              </p>
            )}

            <div className="ml-6 mt-1 text-xs text-slate-500 dark:text-slate-400">
              {route.vehicleTypes.map((type) => VEHICLE_LABELS[type]).join(" / ")}
              {" · "}
              <StalenessNote verifiedOn={route.verifiedOn} />
            </div>

            {isExpanded && (
              <ul className="ml-6 mt-2 space-y-1">
                {route.stops.map((stop) => (
                  <li key={stop.id}>
                    <button
                      type="button"
                      onClick={() => onStopSelect(stop)}
                      className={`flex items-center gap-1 text-left text-xs ${
                        stop.isOutsideCity
                          ? "text-slate-400 dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {stop.name}
                      {stop.isTerminus && " (terminus)"}
                      {stop.sharedWithRouteIds?.length ? (
                        <ArrowLeftRight
                          size={11}
                          aria-label="shared with other routes"
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
