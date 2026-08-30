"use client";

import { Menu } from "lucide-react";
import Image from "next/image";

interface AppHeaderProps {
  onMenuOpen: () => void;
}

// Top bar + hamburger menu — replaces the old NavRail (side rail on desktop,
// bottom bar on mobile). Layout modeled on GenSan Transport: logo/title on
// the left, a single hamburger button on the right that opens MenuDrawer for
// tab navigation and quick links. Mobile-only (md:hidden) — on desktop the
// branding moves into the sidebar (SidebarBrand) and the persistent sidebar
// is the nav surface instead, so MenuDrawer is never reachable there and no
// full-width bar sits above the map.
export function AppHeader({ onMenuOpen }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 md:hidden">
      <div className="flex items-center gap-2">
        <Image src="/sjdm-transport-logo.png" alt="" width={32} height={32} className="h-8 w-8" priority />
        <span className="text-base font-semibold text-slate-800">SJDM Transport</span>
      </div>
      <button
        type="button"
        onClick={onMenuOpen}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
      >
        <Menu size={22} aria-hidden />
      </button>
    </header>
  );
}
