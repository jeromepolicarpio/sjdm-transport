"use client";

import { Capacitor } from "@capacitor/core";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { LandingPage } from "@/components/landing/LandingPage";

// next/dynamic + ssr:false keeps AppShell (and its maplibre-gl chunk) out
// of both the prerendered HTML and the JS a web visitor has to fetch to
// see the landing page — it's only pulled in if the native check below
// actually flips isNative to true.
const AppShell = dynamic(
  () => import("@/components/AppShell").then((mod) => mod.AppShell),
  { ssr: false },
);

// The Android build (Capacitor) bundles this static export and loads "/"
// as its entry point — same URL a web visitor lands on. Rather than
// reconfiguring Capacitor's webDir entry (which would also move where
// service-worker/PWA installs point), this gate decides at runtime: the
// installed native app renders the map tool directly, everyone else on
// the web gets the marketing landing page. "/app" always renders the tool
// too, so it stays a stable direct link regardless of this gate.
//
// Defaults to LandingPage, not null: both the static export and the
// client's first render need to produce the real landing-page HTML (for
// SEO and to avoid a blank first paint) rather than nothing while the
// native check is pending. The tradeoff is that a native user sees the
// landing page flash for one frame before this swaps to AppShell — cheap
// for them (a local bundled-asset fetch), and worth it to give the web the
// content it needs by default.
interface RootGateProps {
  puvRouteCount: number;
}

export function RootGate({ puvRouteCount }: RootGateProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Capacitor.isNativePlatform() reads `window.Capacitor`, which doesn't
    // exist during the static-export build (no `window`) — it can only be
    // checked here, post-mount, not computed synchronously during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return isNative ? (
    <AppShell />
  ) : (
    <LandingPage puvRouteCount={puvRouteCount} />
  );
}
