"use client";

import { Network } from "@capacitor/network";
import { useEffect, useState } from "react";

// Capacitor's Network plugin falls back to the browser APIs on web, so this
// hook works the same in the Android WebView and in `next dev`.
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let sawLiveEvent = false;

    const listener = Network.addListener("networkStatusChange", (status) => {
      sawLiveEvent = true;
      setIsOnline(status.connected);
    });

    // Registered after the listener so a networkStatusChange firing while
    // this is in flight isn't clobbered by a stale getStatus() resolution.
    Network.getStatus()
      .then((status) => {
        if (!cancelled && !sawLiveEvent) setIsOnline(status.connected);
      })
      .catch(() => {
        // Stay on the "online" default — better to let a request fail than
        // to falsely tell the user they're offline.
      });

    return () => {
      cancelled = true;
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return isOnline;
}
