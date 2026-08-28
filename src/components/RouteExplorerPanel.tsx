"use client";

import { useState } from "react";

import type { PuvRoute, RouteStop, VehicleType } from "@/types/puv-route";

interface RouteExplorerPanelProps {
  routes: PuvRoute[];
  visibleRouteIds: ReadonlySet<string>;
  onToggleRoute: (routeId: string) => void;
  onStopSelect: (stop: RouteStop) => void;
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
    <span
      className={
        isStale ? "text-amber-700 dark:text-amber-400" : undefined
      }
    >
      verified {verifiedOn}
      {isStale && " (possibly outdated)"}
    </span>
  );
}

export function RouteExplorerPanel({
  routes,
  visibleRouteIds,
  onToggleRoute,
  onStopSelect,
}: RouteExplorerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-h-[calc(100%-1.5rem)] w-72 flex-col">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="pointer-events-auto self-start rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow dark:bg-slate-900 dark:text-slate-100"
      >
        {isOpen ? "Hide routes" : "Route explorer"}
      </button>

      {isOpen && (
        <div className="pointer-events-auto mt-2 flex-1 overflow-y-auto rounded-md bg-white p-3 text-sm shadow dark:bg-slate-900">
          {routes.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-300">
              No routes yet — PUV corridors are field-surveyed and GPS-logged
              before they ship here (see docs/HANDOFF.md §7). Check back once
              the first route is verified.
            </p>
          ) : (
            <ul className="space-y-2">
              {routes.map((route) => {
                const isVisible = visibleRouteIds.has(route.id);
                const isExpanded = expandedRouteId === route.id;

                return (
                  <li
                    key={route.id}
                    className="border-b border-slate-100 pb-2 last:border-b-0 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onToggleRoute(route.id)}
                        aria-label={`Show ${route.name} on the map`}
                      />
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: route.color }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRouteId(isExpanded ? null : route.id)
                        }
                        aria-expanded={isExpanded}
                        className="flex-1 text-left font-medium text-slate-800 dark:text-slate-100"
                      >
                        {route.name}
                      </button>
                    </div>

                    <div className="ml-6 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {route.vehicleTypes
                        .map((type) => VEHICLE_LABELS[type])
                        .join(" / ")}
                      {" · "}
                      <StalenessNote verifiedOn={route.verifiedOn} />
                      {route.contributor && <> · logged by {route.contributor}</>}
                    </div>

                    {isExpanded && (
                      <ul className="ml-6 mt-2 space-y-1">
                        {route.stops.map((stop) => (
                          <li key={stop.id}>
                            <button
                              type="button"
                              onClick={() => onStopSelect(stop)}
                              className={
                                stop.isOutsideCity
                                  ? "text-left text-xs text-slate-400 dark:text-slate-500"
                                  : "text-left text-xs text-slate-700 dark:text-slate-200"
                              }
                            >
                              {stop.name}
                              {stop.isTerminus && " (terminus)"}
                              {stop.sharedWithRouteIds?.length ? (
                                <span aria-label=", shared with other routes">
                                  {" "}
                                  ⇄
                                </span>
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
          )}
        </div>
      )}
    </div>
  );
}
