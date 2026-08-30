import { AlertTriangle } from "lucide-react";

import { FEEDBACK_FORM_URL } from "@/lib/feedback-form";

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
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block underline"
          >
            Know the correct route? Send us feedback
          </a>
        </div>
      </div>
    </div>
  );
}
