import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Code2, Flame } from "lucide-react";

// Google Form for route corrections / accuracy feedback.
const FEEDBACK_FORM_URL: string | null =
  "https://docs.google.com/forms/d/e/1FAIpQLSe4org1BVQZjcvN08Yyrfc-SLZ12FI9aC8F-l66fAqbCoxJbQ/viewform?usp=dialog";

export function AboutPanel() {
  return (
    <div className="flex flex-col gap-1 p-3 text-sm text-slate-700">
      {/* App identity */}
      <div className="mb-3 flex items-center gap-3">
        <Image
          src="/sjdm-transport-logo.png"
          alt="SJDM Transport"
          width={44}
          height={44}
          className="rounded-xl"
          priority
        />
        <div>
          <p className="font-bold leading-tight text-slate-900">
            SJDM Transport
          </p>
          <p className="text-sm text-slate-400">
            Fares and routes for every San Jose&#241;o commute
          </p>
        </div>
      </div>

      <div className="mb-4 border-t border-slate-100" />

      <Section icon={<Heart size={14} className="text-red-400" />} title="The Story">
        <p className="mb-3 leading-relaxed text-slate-600">
          SJDM Transport started from a familiar frustration: not knowing if
          the tricycle fare you were quoted was fair, or which bus and
          jeepney actually pass through your barangay. The city&apos;s fare
          ordinance exists, but nobody carries a copy of it around.
        </p>
        <p className="leading-relaxed text-slate-600">
          This app puts that information on the map instead &mdash; tap your
          start and destination, and get the fare the ordinance says you
          should pay.
        </p>
      </Section>

      <Section icon={<MapPin size={14} className="text-blue-500" />} title="What this is">
        <p className="mb-3 leading-relaxed text-slate-600">
          A free, ad-free, non-commercial app to help commuters in the City
          of San Jose del Monte (CSJDM) figure out the correct tricycle fare
          and the PUV routes that serve the city.
        </p>
      </Section>

      <Section title="Routes only, no PUV fares">
        <p className="leading-relaxed text-slate-600">
          The bus/jeepney explorer shows routes and stops only &mdash; never
          a fare. Once a vehicle leaves SJDM it falls under national LTFRB
          fare regulation, not the city&apos;s tricycle ordinance, and
          showing an ordinance-styled number next to an LTFRB-governed route
          would be misleading. Tricycle fares stay inside SJDM, where the
          city ordinance actually applies.
        </p>
      </Section>

      <Section title="Data confidence">
        <p className="leading-relaxed text-slate-600">
          Every route currently shown was imported from a Google Maps
          directions export the resident who runs this app rode and pointed
          at &mdash; not yet a GPS-logged ride-along. That&apos;s why every
          route still carries the &quot;not yet verified on the ground&quot;
          flag. Drivers vary their exact path; treat these as a strong
          guide, not a guarantee.
        </p>
      </Section>

      <Section icon={<Code2 size={14} className="text-emerald-500" />} title="A Solo Project">
        <p className="leading-relaxed text-slate-600">
          This entire app was designed and built by one person &mdash; no
          company, no team, no budget. Just pure passion for SJDM and the
          drive to build something meaningful for the community.
        </p>
      </Section>

      <Section title="Credits">
        <ul className="list-inside list-disc space-y-1 text-slate-600">
          <li>Map data © OpenStreetMap contributors</li>
          <li>Vector basemap tiles © OpenMapTiles</li>
          <li>Road routing by OSRM (Open Source Routing Machine)</li>
          <li>Place name lookup by Photon, run by Komoot</li>
          <li>
            CSJDM Tricycle Regulatory Unit &mdash; 2022 fare schedule; an
            update has been requested and is still pending
          </li>
          <li>
            GenSan Transport by{" "}
            <a
              href="https://michaelpanizales.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Michael Panizales
            </a>{" "}
            &mdash; the app that set the bar this one is chasing
          </li>
        </ul>
      </Section>

      <div className="mb-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
        <Link href="/privacy" className="text-blue-600 underline">
          Privacy policy
        </Link>
        {FEEDBACK_FORM_URL ? (
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            Send feedback / report a route
          </a>
        ) : (
          <span className="text-slate-400">Feedback form coming soon</span>
        )}
      </div>

      {/* Support / donations */}
      <div className="mt-1 mb-5 border-t border-slate-100 pt-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Flame size={14} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-slate-800">
            Support This Project
          </h3>
        </div>
        <p className="mb-4 leading-relaxed text-slate-500">
          This app is completely free and not monetized. If you&apos;d like
          to support continued development, donations are welcome but never
          required.
        </p>
        <div className="flex gap-2">
          <div
            className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl p-3"
            style={{ backgroundColor: "#007AFF" }}
          >
            <span className="text-sm font-bold tracking-wide text-white">
              GCash
            </span>
            <Image
              src="/qr-sjdm-gcash.png"
              alt="GCash QR code"
              width={200}
              height={200}
              className="aspect-square w-full rounded-md object-cover"
            />
          </div>
          <div
            className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-xl p-3"
            style={{ backgroundColor: "#007AFF" }}
          >
            <span className="text-sm font-bold tracking-wide">
              <span className="text-white">BD</span>
              <span className="text-yellow-400">O</span>
            </span>
            <Image
              src="/qr-sjdm-bdo.png"
              alt="BDO QR code"
              width={200}
              height={200}
              className="aspect-square w-full rounded-md object-cover"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-400">
          Developed by{" "}
          <a
            href="https://jeromepolicarpio.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-600 underline underline-offset-2 hover:text-blue-500"
          >
            Jerome Policarpio
          </a>
        </p>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
