"use client";

import { Bus, Check, X } from "lucide-react";
import { useEffect } from "react";

import { QuickLinks } from "@/components/QuickLinks";
import { TrikeIcon } from "@/components/TrikeIcon";
import type { AppTab } from "@/types/app-tab";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onViewFareMatrix: () => void;
  onOpenAbout: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: "fare", label: "Trike Fare" },
  { id: "routes", label: "Bus/Jeep Routes" },
];

// Slide-in nav — replaces the old always-visible NavRail. Modeled on GenSan
// Transport's hamburger menu: tab switcher up top, "About" and the fare
// matrix demoted to a QUICK LINKS section since they're reference material,
// not primary navigation.
export function MenuDrawer({
  open,
  onClose,
  activeTab,
  onTabChange,
  onViewFareMatrix,
  onOpenAbout,
}: MenuDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-base font-semibold text-slate-800">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav className="flex flex-col p-2" aria-label="Sections">
          {NAV_ITEMS.map(({ id, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onTabChange(id);
                  onClose();
                }}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {id === "fare" ? (
                  <TrikeIcon className={`h-5 w-5 shrink-0 ${isActive ? "bg-blue-700" : "bg-slate-500"}`} />
                ) : (
                  <Bus size={20} className="shrink-0" aria-hidden />
                )}
                <span className="flex-1">{label}</span>
                {isActive && <Check size={16} className="shrink-0" aria-hidden />}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Quick links
        </div>
        <QuickLinks
          onViewFareMatrix={() => {
            onViewFareMatrix();
            onClose();
          }}
          onOpenAbout={() => {
            onOpenAbout();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
