import Link from "next/link";

// Google Form for route corrections / accuracy feedback. Fill this in and
// remove the disabled state on the link below once the form exists.
const FEEDBACK_FORM_URL: string | null = null; // TODO: Google Form URL

export function AboutPanel() {
  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-slate-700 dark:text-slate-200">
      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">
          What this is
        </h2>
        <p className="mt-1">
          A free, ad-free, non-commercial app to help commuters in the City
          of San Jose del Monte (CSJDM) figure out the correct tricycle fare
          and the PUV routes that serve the city.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">
          Routes only, no PUV fares
        </h2>
        <p className="mt-1">
          The bus/jeepney explorer shows routes and stops only — never a
          fare. Once a vehicle leaves SJDM it falls under national LTFRB
          fare regulation, not the city&apos;s tricycle ordinance, and
          showing an ordinance-styled number next to an LTFRB-governed route
          would be misleading. Tricycle fares stay inside SJDM, where the
          city ordinance actually applies.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">
          Data confidence
        </h2>
        <p className="mt-1">
          Every route currently shown was imported from a Google Maps
          directions export the resident who runs this app rode and pointed
          at — not yet a GPS-logged ride-along. That&apos;s why every route
          still carries the &quot;not yet verified on the ground&quot; flag.
          Drivers vary their exact path; treat these as a strong guide, not
          a guarantee.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">
          Credits
        </h2>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>Map data © OpenStreetMap contributors</li>
          <li>Vector basemap tiles © OpenMapTiles</li>
          <li>Road routing by OSRM (Open Source Routing Machine)</li>
          <li>Place name lookup by Photon, run by Komoot</li>
          <li>
            CSJDM Tricycle Regulatory Unit — 2022 fare schedule; an update has
            been requested and is still pending
          </li>
          <li>
            Route explorer layout inspired by GenSan Transport by Michael
            Panizales
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <Link href="/privacy" className="text-blue-600 underline dark:text-blue-400">
          Privacy policy
        </Link>
        {FEEDBACK_FORM_URL ? (
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            Send feedback / report a route
          </a>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Feedback form coming soon
          </span>
        )}
      </section>
    </div>
  );
}
