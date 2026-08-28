import type { FareEntry } from "@/types/tricycle";

// Empty until the CSJDM Tricycle Regulatory Unit supplies the ordinance fare
// matrix annex (requested, awaiting reply — see docs/HANDOFF.md §7).
//
// DO NOT INVENT FARE NUMBERS. Not placeholders, not interpolation from other
// cities, not scraped figures. An empty matrix producing "data pending" in the
// UI is correct; a guessed fare is not.
export const fareMatrix: FareEntry[] = [];
