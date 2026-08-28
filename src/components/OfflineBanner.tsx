"use client";

import { useNetworkStatus } from "@/lib/use-network-status";

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
      You&apos;re offline — showing the offline map. Fare lookup will work
      offline too, once fare data is live.
    </div>
  );
}
