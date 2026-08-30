export type AppTab = "fare" | "routes";

// Single source of truth for tab labels — NavRail, MenuDrawer, and
// AppShell's mobile sheet header all read from this instead of declaring
// their own strings, so the same destination can't end up with three
// different names across surfaces (heuristic audit finding, 2026-08-30).
export const TAB_LABELS: Record<AppTab, string> = {
  fare: "Trike Fare",
  routes: "Bus/Jeep Routes",
};
