"use client";

import { useRef, useState } from "react";

import type { CityMapHandle } from "@/components/CityMap";
import { CityMap } from "@/components/CityMap";
import { RouteExplorerPanel } from "@/components/RouteExplorerPanel";
import { puvRoutes } from "@/data/puv-routes";
import type { RouteStop } from "@/types/puv-route";

export function MapShell() {
  const mapRef = useRef<CityMapHandle>(null);
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(
    () => new Set(puvRoutes.map((route) => route.id)),
  );

  const handleToggleRoute = (routeId: string) => {
    setVisibleRouteIds((current) => {
      const next = new Set(current);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const handleStopSelect = (stop: RouteStop) => {
    mapRef.current?.flyTo(stop.coords);
  };

  return (
    <div className="relative min-h-0 flex-1">
      <CityMap ref={mapRef} routes={puvRoutes} visibleRouteIds={visibleRouteIds} />
      <RouteExplorerPanel
        routes={puvRoutes}
        visibleRouteIds={visibleRouteIds}
        onToggleRoute={handleToggleRoute}
        onStopSelect={handleStopSelect}
      />
    </div>
  );
}
