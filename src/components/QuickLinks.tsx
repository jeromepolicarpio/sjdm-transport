"use client";

import { FileText, Info } from "lucide-react";

interface QuickLinksProps {
  onViewFareMatrix: () => void;
  onOpenAbout: () => void;
}

// Reference-material links, demoted from primary navigation (they're not a
// tab). Shared by MenuDrawer (mobile slide-in) and the desktop sidebar
// footer so the two surfaces can't drift apart.
export function QuickLinks({ onViewFareMatrix, onOpenAbout }: QuickLinksProps) {
  return (
    <div className="flex flex-col p-2">
      <button
        type="button"
        onClick={onViewFareMatrix}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <FileText size={20} className="shrink-0" aria-hidden />
        View Fare Matrix
      </button>
      <button
        type="button"
        onClick={onOpenAbout}
        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Info size={20} className="shrink-0" aria-hidden />
        About
      </button>
    </div>
  );
}
