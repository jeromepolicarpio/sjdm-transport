# SJDM Transport — Development Progress

Tracks the build order defined in [`HANDOFF.md`](./HANDOFF.md) §8. Update this file as steps complete — check off `[x]` and note the date.

**Legend:** ✅ Done · 🚧 In progress · ⬜ Not started · 🚫 Blocked

---

## Overall status

| Phase | Status | Progress |
|---|---|---|
| Phase 1 — Scaffold & unblocked parts | ✅ Done | 6/6 |
| Phase 2 — Mobile shell | 🚧 In progress | 1/4 |
| Phase 3 — Route explorer | ⬜ Not started | 0/3 |
| Phase 4 — Release | ⬜ Not started | 0/3 |

---

## Phase 1 — Scaffold and the parts nothing blocks ✅

- [x] Init Next.js with `output: 'export'`, TypeScript strict, Tailwind — build verified static
- [x] Base map screen with MapLibre + OSM tiles
- [x] City boundary layer (anchor, not mask)
- [x] Zone-lookup module with empty data file (structured for later JSON fill-in)
- [x] "Fare data pending" UI state
- [x] Deploy to Vercel — live at `sjdm-transport.vercel.app`

**Notes:** React Strict Mode double-invoke, maplibre-gl worker path, and layout issues hit and fixed along the way. Repo pushed to `jeromepolicarpio/sjdm-transport` on GitHub.

---

## Phase 2 — Mobile shell 🚧

- [x] Add Capacitor, get a debug APK onto a real device — built & deployed to AVD emulator, map/boundary/fare-banner verified rendering
- [ ] Native geolocation via Capacitor Geolocation
- [ ] Network-state detection and offline UI states
- [ ] PMTiles generation and offline map loading (must cover outbound corridors to their termini)

**Notes:** Android SDK + AVD (Medium Phone, D: drive) set up; Java blocker (needed Temurin 21, not 17) resolved. `android/.idea/` is git-ignored.

---

## Phase 3 — Route explorer ⬜

- [ ] PUV route data model (GeoJSON LineString + stops), OSRM-snapped to real roads
- [ ] Route explorer UI (expand/collapse stops, per-route toggles, dashed alternates, shared-stop indicators, tap-to-fly-to-stop, lighter styling beyond city line)
- [ ] Per-route contributor credits + `verifiedOn` staleness indicator

**Blocked on:** field survey / GPS logging of real routes (independent of TRU reply — can start anytime).

---

## Phase 4 — Release ⬜

- [ ] Privacy policy page
- [ ] Play Console setup, closed testing track, recruit ~18 testers
- [ ] 14-day closed test, then apply for production access

---

## External blockers (not phase-gated)

- **Tricycle fare matrix, zone list, TODA masterlist, current Tricycle Code** — requested from CSJDM TRU via email, awaiting reply. Fallback: file via foi.gov.ph if no response within ~2 weeks of the request.
- Fare figures must never be invented, scraped, or interpolated — see `HANDOFF.md` §3.
