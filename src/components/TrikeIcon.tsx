const TRIKE_ICON_SRC = "/trike-icon.png";

// Source PNG is a dark-stroke icon on a transparent canvas (RGBA, not a flat
// opaque image) — used as a CSS mask rather than an <img> so it can be
// tinted with currentColor like the Lucide icons, matching the active state.
// Shared by MenuDrawer's mobile nav and NavRail's desktop rail so both use
// the same trike glyph.
export function TrikeIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        WebkitMaskImage: `url(${TRIKE_ICON_SRC})`,
        maskImage: `url(${TRIKE_ICON_SRC})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
