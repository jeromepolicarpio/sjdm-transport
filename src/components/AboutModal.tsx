"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { AboutPanel } from "@/components/panels/AboutPanel";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

// Reference content, not a persistent tab — opened from MenuDrawer's
// QUICK LINKS, same modal pattern as FareMatrixModal rather than occupying
// the sidebar/bottom-sheet like the Bus Routes tab does.
export function AboutModal({ open, onClose }: AboutModalProps) {
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
      aria-label="About SJDM Transport"
      className="fixed inset-0 z-50 flex flex-col bg-black/40 transition-opacity duration-200 starting:opacity-0"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-auto flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-white shadow-xl transition-transform duration-200 ease-out starting:translate-y-4 md:my-auto md:rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-base font-semibold text-slate-800">About</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AboutPanel />
        </div>
      </div>
    </div>
  );
}
