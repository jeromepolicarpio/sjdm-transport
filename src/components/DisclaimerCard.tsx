import { AlertTriangle } from "lucide-react";

// Google Form for route corrections / accuracy feedback — same value as
// src/components/panels/AboutPanel.tsx. TODO: fill in once the form exists.
const FEEDBACK_FORM_URL: string | null = null;

// Pinned to the sidebar bottom. Not decoration — docs/HANDOFF.md §7 states
// an unverified route is worse than a missing one, so surfacing that
// tradeoff plainly is a product requirement, not styling.
export function DisclaimerCard() {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-slate-800 dark:bg-amber-950/20 dark:text-amber-200">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">Routes may be inaccurate</p>
          <p className="mt-1 opacity-90">
            Routes come from directions exports, not GPS-logged rides.
            Drivers sometimes take different turns depending on traffic or
            their assigned area.
          </p>
          {FEEDBACK_FORM_URL ? (
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block underline"
            >
              Know the correct route? Send us feedback
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
