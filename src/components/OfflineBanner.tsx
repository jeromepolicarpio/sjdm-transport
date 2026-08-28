"use client";

import { useNetworkStatus } from "@/lib/use-network-status";

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
      You&apos;re offline — map tiles need a connection until offline maps
      ship. Fare lookup will keep working once fare data is live.
    </div>
  );
}
