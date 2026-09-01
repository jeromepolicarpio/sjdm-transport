import { Navigation } from "lucide-react";

// Static mockup of the fare-picker view — never the real MapLibre canvas
// (that needs PMTiles/network and a client mount). Purely decorative, so a
// lightweight hand-drawn SVG stand-in keeps maplibre-gl out of the landing
// page's JS entirely (RootGate only loads AppShell via next/dynamic when
// the native check passes).
const PINS = [
  { top: "32%", left: "38%", label: "Starting point", kind: "origin" as const },
  { top: "58%", left: "66%", label: "Destination", kind: "destination" as const },
];

export function AppPreview() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="flex-1 -ml-10 pointer-events-none text-center text-xs font-medium text-slate-400">
          SJDM Transport
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full bg-slate-100">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 300" preserveAspectRatio="none">
          <path d="M0 140 Q120 120 200 150 Q290 180 400 160" stroke="#94a3b8" strokeWidth="3" fill="none" />
          <path d="M150 0 Q160 120 190 150 Q220 190 210 300" stroke="#94a3b8" strokeWidth="2" fill="none" />
        </svg>

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="none">
          <path d="M150 96 Q220 130 264 174" stroke="#2563eb" strokeWidth="3" strokeDasharray="7 6" fill="none" />
        </svg>

        {PINS.map((pin) => (
          <div
            key={pin.label}
            className="absolute flex flex-col items-center"
            style={{ top: pin.top, left: pin.left, transform: "translate(-50%, -100%)" }}
          >
            <div className="mb-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 shadow-md">
              <p className="text-[10px] font-medium text-slate-700">{pin.label}</p>
            </div>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                pin.kind === "origin" ? "bg-blue-600" : "bg-emerald-600"
              }`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white/90" />
            </div>
          </div>
        ))}

        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Navigation size={12} className="text-blue-600" aria-hidden />
            Starting point → Destination
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900">₱17.00</span>
            <span className="text-[11px] text-slate-400">Regular fare</span>
          </div>
        </div>
      </div>
    </div>
  );
}
