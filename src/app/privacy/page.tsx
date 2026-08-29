import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — SJDM Transport",
  description:
    "SJDM Transport does not collect, store, or transmit any personal data.",
};

const LAST_UPDATED = "2026-08-29";

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
        center the map on your current position. This location is used only
        on your device, for that one purpose, and is never sent anywhere —
        not to us, and not to any third party. You can deny or revoke
        location permission at any time in your device settings without
        losing any other app functionality.
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
