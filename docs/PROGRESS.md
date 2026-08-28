# SJDM Transport — Development Progress

Tracks the build order defined in [`HANDOFF.md`](./HANDOFF.md) §8. Update this file as steps complete — check off `[x]` and note the date.

**Legend:** ✅ Done · 🚧 In progress · ⬜ Not started · 🚫 Blocked

---

## Overall status

| Phase | Status | Progress |
|---|---|---|
| Phase 1 — Scaffold & unblocked parts | ✅ Done | 6/6 |
| Phase 2 — Mobile shell | ✅ Done | 4/4 |
| Phase 3 — Route explorer | 🚧 In progress | 3/3 groundwork, 0 routes |
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

## Phase 2 — Mobile shell ✅

- [x] Add Capacitor, get a debug APK onto a real device — built & deployed to AVD emulator, map/boundary/fare-banner verified rendering
- [x] Native geolocation via Capacitor Geolocation — `LocateControl` (custom maplibre-gl `IControl`) requests permission via `@capacitor/geolocation`, flies to and marks the user's position; `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION` added to `AndroidManifest.xml`; verified on AVD with mock GPS fix (permission dialog → grant → fly-to → marker)
- [x] Network-state detection and offline UI states — `useNetworkStatus` hook wraps `@capacitor/network` (listener registered before the initial `getStatus()` to avoid a stale-write race; falls back to browser APIs on web); `OfflineBanner` shows when offline; `ACCESS_NETWORK_STATE` added to `AndroidManifest.xml`
- [x] PMTiles generation and offline map loading — extract covers the city plus an ~8km buffer on three sides, extended further south (to lat 14.60) to actually reach Novaliches/Monumento along Quirino Highway, the one corridor HANDOFF.md §7 already names by operator. The rest of the "outbound corridors to their termini" requirement is still a stand-in, pending Phase 3 field survey — re-derive per-corridor once routes are known. Built locally with Planetiler (OpenMapTiles schema, z8–15, ~15MB) from a Geofabrik Philippines extract via `scripts/build-pmtiles.sh`; ships bundled at `public/tiles/sjdm.pmtiles`, committed directly (not Git LFS — simplest option for a single ~15MB file; revisit if regenerated many times or the extract grows well past this size). `CityMap` swaps between the raster OSM style and a hand-written vector style (`src/lib/offline-style.ts`) based on `useNetworkStatus`. **Gotcha:** Capacitor's local WebView asset server doesn't honor HTTP Range requests, which pmtiles' default fetch source depends on — tiles failed silently (`Failed to fetch`) until swapped for `BundledPMTilesSource` (`src/lib/bundled-pmtiles-source.ts`), which fetches the whole archive once and serves ranges from memory (fine at this size; switch to Capacitor's Filesystem plugin per HANDOFF.md §6 if the archive grows past tens of MB). Verified offline rendering (roads/water/landcover/boundaries) and both directions of the online↔offline style swap on the AVD emulator.

**Known gap:** the offline style has no labels — no font glyphs are bundled yet, even though the archive's `place`/`transportation_name` layers already have the data. Geometry-only is enough to orient by for now; bundling one font's Latin glyph range and adding label layers is a reasonable follow-up, not a rebuild.

**Notes:** Android SDK + AVD (Medium Phone, D: drive) set up; Java blocker (needed Temurin 21, not 17) resolved. `android/.idea/` is git-ignored. PMTiles build tooling (planetiler.jar + ~2GB scratch data) lives in `.tools/`, gitignored — regenerate via `scripts/build-pmtiles.sh` if the extract ever needs updating with real Phase 3 corridor data.

---

## Phase 3 — Route explorer 🚧

- [x] PUV route data model — `PuvRoute`/`RouteStop`/`AlternateRoute`/`VehicleType` in `src/types/puv-route.ts` (no fare fields, by design — §3b); `src/data/puv-routes.ts` ships empty, same "don't invent it" rule as `zones.ts`
- [x] Route explorer UI groundwork — `RouteExplorerPanel` (expand/collapse stops, per-route visibility checkboxes, tap-a-stop-to-fly-to via `CityMap`'s new imperative `flyTo` handle) and `src/lib/route-layers.ts` (map layers: dashed alternates, shared-stop indicator via bigger/ringed circles, in-city-vs-outside line weight split by testing each vertex against the city boundary polygon — approximate, no interpolation onto the actual boundary edge)
- [x] Per-route contributor credit + `verifiedOn` staleness indicator — rendered in `RouteExplorerPanel`, flags unverified routes in amber

**Still blocked on real data:** `puvRoutes` is empty, so the UI above is exercised only by its zero-route empty state — the toggle/expand/dashed-alternate/shared-stop/boundary-split code paths are unverified against an actual route until the first one is field-surveyed and GPS-logged. Re-check all of the above once real GeoJSON lands, same spirit as `data_pending` in the fare calculator (§3).

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
