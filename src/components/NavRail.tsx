"use client";

import { Bus, FileText, Info } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { TrikeIcon } from "@/components/TrikeIcon";
import type { AppTab } from "@/types/app-tab";

interface NavRailProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onViewFareMatrix: () => void;
  onOpenAbout: () => void;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: "fare", label: "Trike Fare" },
  { id: "routes", label: "Bus" },
];

function RailTile({
  isActive,
  onClick,
  label,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-center ${
        isActive ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {children}
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </button>
  );
}

// Vertical icon rail — logo pinned at top, the two AppTab destinations as
// icon+label tiles, then the reference-material quick links (fare
// matrix/about) pinned to the bottom via the flex-1 spacer. Rendered inside
// AppShell's `hidden md:flex` aside, so visibility is gated by the parent,
// not here. Replaces the old text-only SidebarTabs + separately-rendered
// QuickLinks. Mobile keeps MenuDrawer, which reuses the same TrikeIcon and
// AppTab list.
export function NavRail({ activeTab, onTabChange, onViewFareMatrix, onOpenAbout }: NavRailProps) {
  return (
    <nav className="flex w-20 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-slate-200">
        <Image src="/sjdm-transport-logo.png" alt="" width={32} height={32} className="h-8 w-8" priority />
      </div>

      <div className="flex flex-col gap-1 p-2" role="tablist" aria-label="Sections">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <RailTile key={id} isActive={isActive} onClick={() => onTabChange(id)} label={label}>
              {id === "fare" ? (
                <TrikeIcon
                  className={`h-[22px] w-[22px] shrink-0 ${isActive ? "bg-blue-700" : "bg-slate-500"}`}
                />
              ) : (
                <Bus size={22} className="shrink-0" aria-hidden />
              )}
            </RailTile>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-1 border-t border-slate-200 p-2">
        <RailTile isActive={false} onClick={onViewFareMatrix} label="Fare Matrix">
          <FileText size={22} className="shrink-0" aria-hidden />
        </RailTile>
        <RailTile isActive={false} onClick={onOpenAbout} label="About">
          <Info size={22} className="shrink-0" aria-hidden />
        </RailTile>
      </div>
    </nav>
  );
}
