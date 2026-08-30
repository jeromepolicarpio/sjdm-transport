"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { fareSchedule } from "@/data/fare-schedule";
import type { FareScheduleEntry } from "@/types/tricycle";

interface FareMatrixModalProps {
  open: boolean;
  onClose: () => void;
}

// Only fields FareScheduleEntry declares as `number` are valid here — this
// keeps a typo'd `key` (e.g. `bracket`, which is a string) a compile error
// instead of silently rendering "₱NaN".
type NumericFareKey = {
  [K in keyof FareScheduleEntry]: FareScheduleEntry[K] extends number ? K : never;
}[keyof FareScheduleEntry];

const ROWS: { label: string; key: NumericFareKey }[] = [
  { label: "First 2 km", key: "firstTwoKmFare" },
  { label: "Succeeding km (per passenger)", key: "succeedingKmFarePerPassenger" },
  { label: "Special trip, 1 passenger", key: "specialTripOnePassengerFare" },
  { label: "Special trip, 2 passengers (each)", key: "specialTripTwoPassengersFareEach" },
  { label: "Regular trip, 3 passengers (each)", key: "regularTripThreePassengersFareEach" },
  { label: "Additional passenger", key: "additionalPassengerFare" },
  { label: "Discounted regular trip", key: "discountedRegularTripFare" },
  { label: "Discounted special trip", key: "discountedSpecialTripFare" },
];

function formatPeso(value: number): string {
  return `₱${value.toFixed(2)}`;
}

// Rendered once from AppShell, triggered from either MenuDrawer's "View Fare
// Matrix" quick link or FareResultCard's ordinance footer. Full-screen so
// the dense 2022 matrix gets real space instead of a cramped panel excerpt.
export function FareMatrixModal({ open, onClose }: FareMatrixModalProps) {
  const [isTextView, setIsTextView] = useState(false);

  // Reset to the image view whenever the modal closes (rather than in an
  // effect keyed on `open`, which would call setState synchronously
  // mid-effect) — this component stays mounted across opens/closes, so
  // without this the text view would persist from a previous visit.
  const handleClose = () => {
    setIsTextView(false);
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // handleClose is redefined every render (it closes over onClose) but
    // only its behavior matters here, not identity; depending on it would
    // tear down and re-add this listener on every render instead of just
    // open/close.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="2022 fare matrix"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 transition-opacity duration-200 starting:opacity-0"
      onClick={handleClose}
    >
      <div
        className="absolute left-3 top-3 z-10 flex items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsTextView((current) => !current)}
          className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow"
        >
          {isTextView ? "View scanned page" : "View as text"}
        </button>
      </div>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
      >
        <X size={20} aria-hidden />
      </button>

      {isTextView ? (
        <div
          className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-white p-4 pt-16"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Text equivalent of the scanned matrix below — the same figures
              the calculator itself uses (src/data/fare-schedule.ts), so a
              screen-reader user or anyone who can't read the scanned image
              still gets the actual numbers, not just an alt-text label. */}
          <div className="w-full max-w-3xl">
            <p id="fare-matrix-caption" className="mb-3 text-left text-xs text-slate-500">
              CSJDM tricycle fare matrix, City Ordinance No. 2022-107-06
            </p>

            {/* Below md: one card per gas-price bracket, label/value pairs
                stacked vertically. A 5-column table (label + 4 brackets)
                can't fit a phone width without hard-wrapping long labels
                like "Succeeding km (per passenger)" into illegible slivers
                or forcing a horizontal scroll users didn't notice was
                there — stacking removes the horizontal axis entirely.
                Matches the app's mobile/desktop split everywhere else
                (AppShell, CityMap, FareResultCard, StartEndBar all use
                md:), so the table doesn't flip on while the rest of the
                shell is still in mobile layout. */}
            <div className="grid gap-4 md:hidden">
              {fareSchedule.map((entry) => (
                <div key={entry.bracket} className="rounded-lg border border-slate-200 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    Gas ₱{entry.minGasolinePrice}–{entry.maxGasolinePrice}/L
                  </h3>
                  <dl className="divide-y divide-slate-100">
                    {ROWS.map(({ label, key }) => (
                      <div key={key} className="flex items-baseline justify-between gap-3 py-1.5">
                        <dt className="text-sm text-slate-600">{label}</dt>
                        <dd className="whitespace-nowrap text-sm font-medium tabular-nums text-slate-900">
                          {formatPeso(entry[key])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            {/* md and up: original table, wide enough to lay out normally. */}
            <table
              aria-labelledby="fare-matrix-caption"
              className="hidden min-w-max border-collapse text-left text-sm md:table"
            >
              <thead>
                <tr>
                  <th scope="col" className="border-b border-slate-200 py-2 pr-3 font-medium text-slate-600">
                    Gas price (per liter)
                  </th>
                  {fareSchedule.map((entry) => (
                    <th
                      key={entry.bracket}
                      scope="col"
                      className="border-b border-slate-200 py-2 pr-3 font-medium text-slate-600"
                    >
                      ₱{entry.minGasolinePrice}–{entry.maxGasolinePrice}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ label, key }) => (
                  <tr key={key}>
                    <th scope="row" className="border-b border-slate-100 py-2 pr-3 font-normal text-slate-700">
                      {label}
                    </th>
                    {fareSchedule.map((entry) => (
                      <td key={entry.bracket} className="border-b border-slate-100 py-2 pr-3 tabular-nums text-slate-800">
                        {formatPeso(entry[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes (ii) and (iv) from the scanned matrix, selected because
                they scope the flat special-trip rate: (ii) it only applies
                when boarding at the terminal, and (iv) it only applies
                inside the TODA's zone of operation. Not a transcription of
                every note on the page (i, iii, v are omitted) — the caption
                below says so and points back to the scanned page for those. */}
            <p className="mt-4 text-xs font-medium text-slate-500">
              Selected notes from the matrix — see the scanned page for the
              full text
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-slate-600">
              <li>
                Pick-up of passengers not at the tricycle terminal (&ldquo;dampot o
                pulot&rdquo; na pasahero) must be charged the regular minimum fare,
                not the special-trip rate.
              </li>
              <li>
                All destinations outside the zone depend on agreement between
                the driver and passenger.
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div
          className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4 pt-16"
          style={{ touchAction: "pinch-zoom" }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local
              asset in a pinch-zoom/scroll container; next/image's intrinsic
              sizing fights that layout. */}
          <img
            src="/fare-matrix-2022.jpg"
            alt="CSJDM tricycle fare matrix, as published in 2022 — figures are also available as text via the 'View as text' button above"
            className="img-outline w-full max-w-3xl"
          />
        </div>
      )}

      <p
        className="border-t border-white/10 bg-black/60 p-2 text-center text-xs text-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        Published 2022 · CSJDM City Ordinance No. 2022-107-06.
      </p>
    </div>
  );
}
