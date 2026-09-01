import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bus,
  CheckCircle,
  Coins,
  MapPin,
  Route,
  ShieldCheck,
  TrendingUp,
  WifiOff,
} from "lucide-react";

import { AppPreview } from "@/components/landing/AppPreview";
import { FEEDBACK_FORM_URL } from "@/lib/feedback-form";

const HOW_IT_WORKS = [
  {
    num: "01",
    icon: MapPin,
    title: "Pin your start and destination",
    desc: "Tap the map or search for a landmark — no address typing required.",
  },
  {
    num: "02",
    icon: Coins,
    title: "Get the ordinance fare",
    desc: "See the exact tricycle fare the city's fare schedule says you should pay, broken down by rate and distance.",
  },
  {
    num: "03",
    icon: Route,
    title: "Explore PUV routes",
    desc: "Browse mapped bus and jeepney routes and their stops across the city.",
  },
];

const FEATURES = [
  {
    icon: Coins,
    title: "Ordinance-based fares",
    desc: "Calculated straight from the CSJDM Tricycle Regulatory Unit's fare schedule — not a guess.",
  },
  {
    icon: WifiOff,
    title: "Works offline in the app",
    desc: "The Android app bundles the map and fare calculator so they keep working without a signal.",
  },
  {
    icon: ShieldCheck,
    title: "Free, ad-free, no account",
    desc: "No sign-up, no tracking, no monetization. Built for the community, not for profit.",
  },
  {
    icon: Bus,
    title: "Real routes, honestly labeled",
    desc: "Every route is imported from an actual trip someone took — never invented — and flagged until it's confirmed on the ground.",
  },
];

interface LandingPageProps {
  puvRouteCount: number;
}

export function LandingPage({ puvRouteCount }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/sjdm-transport-logo.png"
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="text-sm font-bold tracking-tight text-slate-900">
              SJDM Transport
            </span>
          </div>
          <Link
            href="/app"
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Open Map <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </nav>

      <main>
        {/* ── Hero ── */}
        <section className="flex min-h-[100svh] items-center bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                <MapPin size={11} aria-hidden />
                San Jose del Monte, Bulacan
              </div>
              <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
                Know Your Fare
                <br />
                Before You Ride
              </h1>
              <p className="mb-8 max-w-md text-lg leading-relaxed text-slate-500">
                A free tricycle fare calculator and PUV route map for San Jose
                del Monte — based on the city&apos;s official fare ordinance,
                and it works offline.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Open Map
                  <ArrowRight size={15} aria-hidden />
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  See how it works
                </a>
              </div>
            </div>

            <AppPreview />
          </div>
        </section>

        {/* ── City context ── */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, #1e3a5f 0%, #2d5a8e 30%, #c47c2b 65%, #e8a844 85%, #f5c842 100%)",
            }}
          />
          <div className="relative z-10 px-4 py-20 text-center sm:px-6">
            <h2 className="mb-4 text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
              San Jose del Monte
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              The most populous city in Bulacan, San Jose del Monte is a
              vibrant, rapidly developing community — with commuters who
              deserve to know exactly what a fair fare looks like.
            </p>
          </div>

          <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={<MapPin size={18} className="text-blue-200" aria-hidden />}
                title="Strategic Location"
                desc="Bordering Quezon City and Caloocan, SJDM sits at the northern edge of Metro Manila's urban expansion."
              />
              <StatCard
                icon={<TrendingUp size={18} className="text-blue-200" aria-hidden />}
                title="651,813 Residents"
                desc="2020 census — the most populous city in Bulacan, spread across 59 barangays."
              />
              <StatCard
                icon={<Bus size={18} className="text-blue-200" aria-hidden />}
                title={`${puvRouteCount} PUV Routes Mapped`}
                desc="Bus and jeepney routes connecting barangays, markets, schools, and terminals across the city."
              />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="border-t border-slate-100 bg-slate-50 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-500">
                How it works
              </p>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Three steps to a fair fare
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {HOW_IT_WORKS.map(({ num, icon: Icon, title, desc }) => (
                <div
                  key={num}
                  className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 text-5xl font-black leading-none text-blue-300">
                    {num}
                  </div>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <Icon size={18} className="text-blue-600" aria-hidden />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-slate-100 bg-white px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-500">
                Features
              </p>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Built for the community
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex h-full gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon size={19} className="text-blue-600" aria-hidden />
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-blue-600 px-4 py-28 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <CheckCircle size={11} aria-hidden />
              Free to use · No sign-up · No tracking
            </div>
            <h2 className="mb-5 text-3xl font-bold text-white sm:text-4xl">
              Ready to check your fare?
            </h2>
            <p className="mx-auto mb-10 max-w-md text-lg leading-relaxed text-blue-100">
              Open the map, drop your pin, and know the correct fare before the
              tricycle even arrives.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-blue-700 transition-colors hover:bg-slate-100"
            >
              Open Map
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-slate-900 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/sjdm-transport-logo.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md opacity-70"
            />
            <span className="text-sm font-semibold text-white/80">SJDM Transport</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/app" className="text-sm text-white/70 transition-colors hover:text-white">
              Map
            </Link>
            <Link href="/privacy" className="text-sm text-white/70 transition-colors hover:text-white">
              Privacy
            </Link>
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Feedback
            </a>
          </div>
          <div className="my-2 w-full border-t border-white/10" />
          <p className="text-xs text-blue-300">
            Developed by{" "}
            <a
              href="https://jeromepolicarpio.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-blue-200"
            >
              Jerome Policarpio
            </a>
            {" "}· inspired by{" "}
            <a
              href="https://gensantransport.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-blue-200"
            >
              GenSan Transport
            </a>
          </p>
          <p className="text-center text-xs text-white/50" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} SJDM Transport. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="h-full rounded-2xl p-5"
      style={{
        background: "rgba(15, 30, 60, 0.72)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <h3 className="mb-2 font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-blue-100/70">{desc}</p>
    </div>
  );
}
