"use client";

import { useNetworkStatus } from "@/lib/use-network-status";

// Overlay pill rather than an in-flow bar — an in-flow banner shifts the map
// down when connectivity drops, forcing a maplibre resize on top of an
// already-disruptive network change.
export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-2">
      <div className="pointer-events-auto rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white shadow dark:bg-slate-100/90 dark:text-slate-900">
        Offline — showing the offline map
      </div>
    </div>
  );
}
