import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "SJDM Transport does not collect, store, or transmit any personal data.",
  alternates: {
    canonical: "/privacy",
  },
};

const LAST_UPDATED = "2026-08-30";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-10">
      <Link href="/" className="text-sm underline underline-offset-2">
        &larr; Back to map
      </Link>

      <h1 className="mt-6 text-2xl font-semibold">Privacy Policy</h1>
      <p className="mt-1 text-sm opacity-70">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6">
        SJDM Transport does not collect, store, transmit, or share any
        personal data. There are no user accounts, no analytics, no
        advertising, and no third-party trackers built into the app.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Location</h2>
      <p className="mt-2">
        The app can use your device&apos;s GPS, with your permission, to
        center the map on your current position or to fill in the tricycle
        fare calculator&apos;s starting point. That request stays on your
        device and is never sent anywhere. You can deny or revoke location
        permission at any time in your device settings without losing any
        other app functionality.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Routing and place names</h2>
      <p className="mt-2">
        The tricycle fare calculator sends the two points you pick — by
        tapping the map or using &quot;My location&quot; — to two free,
        public services so it can draw the actual road route and show a
        place name instead of raw coordinates:{" "}
        <a
          href="https://project-osrm.org/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          OSRM
        </a>{" "}
        (road-network routing and distance) and{" "}
        <a
          href="https://photon.komoot.io/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Photon
        </a>{" "}
        (reverse geocoding, run by Komoot). Each request carries only the
        coordinates for that one point — never your identity, an account, or
        a history of past trips, since this app doesn&apos;t have any of
        those to send. Like any web request, these services see your
        device&apos;s IP address as a normal function of internet routing.
        We don&apos;t control what OSRM or Photon do with that; see their
        own privacy terms if you want more detail. If you&apos;re offline,
        the calculator skips both requests and falls back to your raw
        coordinates and a straight-line distance instead.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Network status</h2>
      <p className="mt-2">
        The app checks whether your device is online or offline so it can
        switch between the live map and a bundled offline map. This check
        happens entirely on your device and is not reported anywhere.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Map tiles</h2>
      <p className="mt-2">
        When you have a network connection, map imagery is loaded from
        OpenStreetMap tile servers, which — like any web request — see the
        requesting device&apos;s IP address as a normal function of internet
        routing. This app does not add any tracking on top of that request.
        When offline, the app instead uses a map bundled inside the app
        itself, and no network request is made at all.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Data we don&apos;t have</h2>
      <p className="mt-2">
        We don&apos;t operate a server that stores your data. We don&apos;t
        know who you are, where you&apos;ve been, or how you use the app. We
        have nothing to sell, share, or lose in a breach, because nothing is
        collected in the first place.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Changes to this policy</h2>
      <p className="mt-2">
        If this app&apos;s data practices ever change, this page will be
        updated first, with a new &quot;last updated&quot; date above.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Contact</h2>
      <p className="mt-2">
        Questions about this policy can be sent to{" "}
        <a
          href="mailto:policarpiojerome2005@gmail.com"
          className="underline underline-offset-2"
        >
          policarpiojerome2005@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
