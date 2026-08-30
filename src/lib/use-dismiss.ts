"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

// Escape key + outside-pointerdown dismissal, generalized out of the
// Escape-only useEffect that AboutModal/FareMatrixModal/MenuDrawer each
// hand-roll (none of them need outside-click since they have a full-screen
// backdrop button/div to do that job instead). PlacePickerMenu has no
// backdrop — it's an in-flow panel, not an overlay — so it needs both.
// Deliberately no body-scroll lock: MenuDrawer is the precedent for
// Escape-without-lock, and a small in-flow dropdown shouldn't lock scroll.
export function useDismiss<T extends HTMLElement>(
  isOpen: boolean,
  onDismiss: () => void,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current) return;
      // A CSS-hidden instance (e.g. FarePanel's copy of PlacePickerMenu,
      // mounted alongside StartEndBar's on mobile via display:none rather
      // than unmounted) still gets this document-level pointerdown. Without
      // this guard it sees every click as "outside" and dismisses itself,
      // clearing the shared openPickerField before the visible instance's
      // click handler runs — silently dropping the selection.
      if (ref.current.offsetParent === null) return;
      if (!ref.current.contains(event.target as Node)) onDismiss();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onDismiss]);

  return ref;
}
