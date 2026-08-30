"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface FareMatrixModalProps {
  open: boolean;
  onClose: () => void;
}

// Rendered once from AppShell, triggered from either MenuDrawer's "View Fare
// Matrix" quick link or FareResultCard's ordinance footer. Full-screen so
// the dense 2022 matrix gets real space instead of a cramped panel excerpt.
export function FareMatrixModal({ open, onClose }: FareMatrixModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="2022 fare matrix"
      className="fixed inset-0 z-50 flex flex-col bg-black/80"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
      >
        <X size={20} aria-hidden />
      </button>

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
          alt="CSJDM tricycle fare matrix, as published in 2022"
          className="w-full max-w-3xl"
        />
      </div>

      <p
        className="border-t border-white/10 bg-black/60 p-2 text-center text-xs text-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        Published 2022 · CSJDM City Ordinance No. 2022-107-06.
      </p>
    </div>
  );
}
