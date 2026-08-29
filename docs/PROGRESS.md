# SJDM Transport — Development Progress

Tracks the build order defined in [`HANDOFF.md`](./HANDOFF.md) §8. Update this file as steps complete — check off `[x]` and note the date.

**Legend:** ✅ Done · 🚧 In progress · ⬜ Not started · 🚫 Blocked

---

## Overall status

| Phase | Status | Progress |
|---|---|---|
| Phase 1 — Scaffold & unblocked parts | ✅ Done | 6/6 |
| Phase 2 — Mobile shell | ✅ Done | 4/4 |
| Phase 3 — Route explorer | 🚧 In progress | 3/3 groundwork, 5 routes (user-supplied) |
| Phase 4 — Release | 🚧 In progress | 1/3 |

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

**Tried and reverted:** briefly seeded `puv-routes.ts` with three routes reconstructed from geocoded landmarks + OSRM's shortest-driving-path geometry (public-source override of the "don't invent it" rule, at explicit user request). Confirmed wrong against what PUVs actually do on the ground — reverted to the empty array; see git history for the attempt. Also learned the scope was wrong: the user wants the route explorer to cover PUV routes **inside SJDM only**, not corridors out to Cubao/Fairview.

- [x] First user-supplied route — `Muzon Central Terminal ↔ SM City San Jose del Monte`. Source: a Google Maps "Directions" KML export the user provided (not a GPS-logged ride-along), imported by parsing the `<coordinates>`; every point checked against `isInsideCity` and confirmed inside SJDM. `contributor` records this provenance; `verifiedOn` stays unset. Typecheck/lint/build pass.
  - First pass simplified the 673-point path down to 58 with Ramer–Douglas–Peucker, which chorded straight across turns and rendered as rough near-90° angles at corners instead of following the road. Reverted to the full, unsimplified 673-point line — exact fidelity to the source KML, no artificial corner-cutting.

- [x] Map panning/zoom restricted to SJDM — `cityBounds` (padded bbox of the city boundary polygon, computed in `src/lib/city-boundary.ts`) passed as `maxBounds` to the MapLibre `Map`, plus a `minZoom` computed via `cameraForBounds` on load/resize so users can't zoom out past the city either (mirrors `sjdm-report-main`'s Leaflet `maxBounds`/`getBoundsZoom` pattern). Applies to both online and offline styles.
- [x] Rounded line joins/caps on all route line layers (`route-layers.ts`) — MapLibre defaulted to sharp miter joins, which read as artificial right-angle corners even on full-fidelity paths.
- [x] Three more routes from a second user-supplied KML (multi-folder export) — `Muzon Central Terminal ↔ Starmall SJDM (via SM City SJDM)`, `SJDM-Tungko Jeepney Terminal ↔ Sapang Palay Terminal`, `Licao-Licao Jeepney Terminal ↔ Muzon Central Terminal ↔ SM City SJDM`. Same import process (full-fidelity `<coordinates>`, no simplification); `sharedWithRouteIds` cross-linked across all four routes wherever a stop (Muzon Central Terminal, SM City SJDM) repeats.
  - `tungko-sapang-palay` is a deliberate exception to the SJDM-only scope: its destination (Sapang Palay Terminal) and part of its path fall just outside the boundary polygon (geocoded under "Norzagaray, Bulacan"). Kept in full at explicit user request rather than trimmed at the line — flagged via that route's `contributor` note and a comment at the top of `puv-routes.ts`.
- [x] Fifth route from an updated version of the same KML export (`SJDM Transport (1).kml`, four folders total — three duplicates of already-imported routes, confirmed identical by diffing coordinates, plus one new one) — `licao-licao-starmall`, named `Licao-Licao Jeepney Terminal ↔ Starmall SJDM (loop via SJDM-Tungko Terminal)`. All 551 points confirmed inside `isInsideCity`; `sharedWithRouteIds` cross-linked at Licao-Licao Terminal (with `licao-licao-muzon-sm-sjdm`), Starmall (with `muzon-starmall`), and SJDM-Tungko Terminal, a mid-route pass-through the line comes within ~63m of (with `tungko-sapang-palay`).
  - Code review flagged that this route is a 21.6km loop against a 2.9km straight-line distance between its two named terminals — confirmed by the user as the real route (not a bad KML export), so `bidirectional` was set to `false` (a loop isn't meaningfully "mirrored" the way this file's other out-and-back routes are) and the name updated to say `loop via` rather than reading as a direct hop.
  - Code review also caught a pre-existing color collision (`muzon-sm-sjdm` and `licao-licao-muzon-sm-sjdm` both `#16a34a`, the two routes that share both terminuses) — recolored `licao-licao-muzon-sm-sjdm` to `#0d9488`.

**Current plan:** repeat the same KML-import process as more routes come in from the user, one at a time, at whatever pace — no expectation of covering the full network. Scope is **SJDM-only** by default (the `tungko-sapang-palay` exception above aside) — routes that leave the city outright (like the earlier reverted attempt to Cubao/Fairview) are still out of scope.

**Blocked on:** the user supplying each additional route's KML/My Maps export (or eventual field survey / GPS logging for `verifiedOn`) — independent of TRU reply, can proceed anytime.

---

## Phase 4 — Release 🚧

- [x] Privacy policy page — `src/app/privacy/page.tsx`, static route at `/privacy`; honest short policy per HANDOFF.md §14 (no data collected/transmitted; on-device-only geolocation and network-status checks; OSM tile requests noted; contact email)
- [ ] Play Console setup, closed testing track, recruit ~18 testers
- [ ] 14-day closed test, then apply for production access

---

## External blockers (not phase-gated)

- **Tricycle fare matrix, zone list, TODA masterlist, current Tricycle Code** — requested from CSJDM TRU via email, awaiting reply. Fallback: file via foi.gov.ph if no response within ~2 weeks of the request.
- Fare figures must never be invented, scraped, or interpolated — see `HANDOFF.md` §3.
