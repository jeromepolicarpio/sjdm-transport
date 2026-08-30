# SJDM Transport — Handoff Brief

Context document for Claude Code. Read this first before touching any code.

**Owner:** Jerome — BSIT student, resident of San Jose del Monte, Bulacan
**Status:** Greenfield. Nothing built yet. This is the plan, not a description of existing code.
**Date of this brief:** August 2026

---

## 1. What this project is

A free, ad-free, non-commercial web app that helps commuters in the City of San Jose del Monte (CSJDM), Bulacan figure out the correct fare and route for local transport. Primary users are students, senior citizens, PWDs, and people unfamiliar with the city.

Two core features, and the split between them is deliberate:

1. **Tricycle Fare Calculator** — inside SJDM only. Tells a passenger the correct ordinance-mandated fare for a trip. Tricycles never leave the city, so the city boundary is a genuine limit here.
2. **Route Explorer** — PUV routes (buses, jeepneys, modern jeepneys) shown on a map with stops. **Routes only. No fares.** See §3b.

Reference project for architecture and scope: `https://gensantransport.vercel.app/documentation` (GenSan Transport, by Michael Panizales). Their public docs were used to plan the architecture. **Do not copy their code, assets, branding, or copy.** Credit them as inspiration in the README and About page.

---

## 2. Planned stack

Nothing is built yet — this is the intended stack.

- Next.js (App Router) + TypeScript strict mode, configured with `output: 'export'` **from the first commit** (see §5)
- Tailwind CSS
- MapLibre GL JS for maps
- OSRM public demo server for routing (road distance/geometry, and `/nearest` for snapping a tapped point to the nearest road)
- Photon (photon.komoot.io), **not Nominatim**, for reverse geocoding — verified Nominatim sends no `Access-Control-Allow-Origin` header, so it's CORS-blocked from a browser `fetch`, and this app is a static export (`output: "export"`) with no API route to proxy through. Photon is OSM-based, CORS-open, and returns SJDM barangay-level names.
- OpenStreetMap raster tiles (PMTiles for offline, see §6)
- Capacitor for the Android shell
- Deployed on Vercel

All external APIs are free, public, and unauthenticated. No environment variables required at present.

---

## 3. The critical difference from GenSan — read this carefully

GenSan uses a single citywide distance formula (flat base fare for the first N km, then a per-km rate). That is simple to code.

**Status update:** an earlier version of this document (and this section) assumed SJDM tricycle fares were a **zone-pair lookup** — resolve origin/destination to numbered TODA zones, look up the fare for that pair — based on City Ordinance No. 2023-030-02 assigning TODAs to numbered zones. That zone list / barangay coverage / TODA masterlist is **still** unreceived from CSJDM TRU.

But the actual fare matrix under City Ordinance No. 2022-107-06 (obtained — see `public/fare-matrix-2022.jpg`, transcribed into `src/data/fare-schedule.ts`) turned out to be something else entirely: a **gasoline-price-tiered, distance/passenger-count schedule**, with no zones anywhere in it. It applies citywide, not per zone pair. So the fare model actually implemented (`src/lib/fare-lookup.ts`) is:

1. Pick the fare-schedule row for the prevailing gasoline price bracket (₱30–50 / 51–70 / 71–90 / 91–110)
2. **Regular trip** (hailed anywhere): first-2km base fare + a flat per-km rate for the OSRM road distance beyond that
3. **Special trip** (exclusive/chartered, to/from a TODA terminal): a flat rate from the schedule, not distance-based
4. Senior/PWD/student get the ordinance's own flat 20%-off figures for each — not a computed 20%, since the published numbers don't reduce cleanly to that (see the comment in `fare-schedule.ts`)

OSRM (`src/lib/osrm.ts`) supplies the road-network distance and the drawn route geometry — it genuinely is part of the fare basis for regular trips now, not just a sanity check as previously written here. If OSRM is unreachable, `fare-lookup.ts` falls back to straight-line (haversine) distance and flags it via `distanceSource`.

The zone/TODA masterlist request to CSJDM TRU is still open — if it ever arrives, it would layer *on top* of this (e.g. confirming which TODA serves a given point), not replace it.

### DO NOT INVENT FARE NUMBERS

This is still the single most important instruction in this document — it just now applies to a schedule that exists rather than one that's missing.

Every figure in `fare-schedule.ts` is transcribed verbatim from the published matrix image. There is no reply yet from CSJDM TRU on whether a newer matrix supersedes the 2022 one (CSJDM held a Tricycle Code seminar for TODA Federation officers in November 2025, so it may have been superseded) — the UI discloses this as "may be outdated" rather than presenting the figure as current fact. Do not:

- Derive a figure (e.g. an exact 20%) when the ordinance gives a different flat number for that same case
- Scrape fare numbers from blogs, Facebook posts, or forums
- Interpolate from other cities' ordinances
- Fill in zone data from guesses if the zone/TODA masterlist ever partially arrives — an incomplete real dataset is fine; a completed-by-guessing one is not

Publishing a wrong fare to a real commuter is the worst possible failure mode for this app. Someone gets overcharged, or a driver gets falsely accused.

---

## 3b. The second difference: SJDM is a hub, not an island

GenSan's transport is self-contained — routes start and end inside the city, so their boundary doubles as a scope boundary and everything outside gets dimmed.

**That model is wrong for SJDM.** Buses, jeepneys, and modern PUVs leave the city, and the outbound trips are the ones commuters most need help with: Fairview, Caloocan, Quezon City. Clipping routes at the city line hides the half of the journey that matters.

### Scope rule (hard constraint)

**Cover routes that originate or terminate in SJDM, drawn all the way to their real terminus. Cover nothing beyond that.**

A route ends at its terminal. From there the app hands off — "transfer here for onward travel" — and stops. This project is the authority on how San Joseños get in and out of their city. It is **not** a Metro Manila trip planner, and must not drift into becoming one. Sakay.ph and Google Maps already own that problem.

Any proposal to add a route with no SJDM endpoint should be rejected.

### Boundary rendering

The city boundary **anchors** the map; it does not fence it.

- Do **not** dim or mask everything outside SJDM
- Draw the full route to its terminus, with the in-city portion at full weight and the out-of-city portion rendered lighter
- Fit map bounds to the selected route, not to the city polygon
- The boundary is still used as a hard limit for the tricycle calculator (§3) — different feature, different rule

### No fares on PUV routes

The Route Explorer shows **routes and stops only**. No fare figures, ever, in v1.

Reasoning: once a vehicle crosses out of SJDM it falls under LTFRB national fare regulation, not the city ordinance — different legal authority, distance-based rather than zone-based, different rates for traditional versus modern PUVs, often a per-route matrix. Sourcing and maintaining that is a separate project. Showing a city-ordinance-styled fare next to an LTFRB-governed route would be actively misleading.

If PUV fares are ever added, they need their own data source and a `fareBasis: 'city_ordinance' | 'ltfrb_national'` discriminator so the two are never conflated. Not v1.

### Data confidence is not uniform

Every SJDM-side stop can be verified on the ground. Manila-end stops cannot be maintained to the same standard. The UI should reflect that honestly rather than presenting all route data with equal confidence — see `verifiedOn` in §9.

---

**Android only. Google Play Store. No iOS.**

Rationale and constraints:

- Apple App Store is deliberately skipped — $99/year and a review cycle isn't worth it for a free civic tool given Android's share in the Philippines
- **Bare APK distribution is not a viable public strategy.** Google's developer verification requires apps to be registered to a verified developer to install on certified Android devices — enforcement began Sept 30 2026 in Brazil, Indonesia, Singapore, and Thailand, expanding globally in 2027. Unverified installs require an advanced flow with a 24-hour wait, or ADB. Ordinary commuters will not do this.
- APK is still fine for demos, the capstone panel, and internal testing
- There is a free student/hobbyist limited-distribution tier (no government ID, up to 20 devices) — useful for testing, not for public release

### Play Store gate

Personal developer accounts created after Nov 13 2023 must run a closed test with **at least 12 testers opted in continuously for 14 days** before applying for production access. Testers must be distinct Google accounts on real devices, joined via the opt-in link. Emulators and duplicate accounts don't count.

Recruit ~18 for buffer. Start this clock early, in parallel with development, using whatever build exists. Cost: $25 one-time.

---

## 5. Technical path: web app first, Capacitor shell early

Build the web app first. Capacitor wraps that same web app — it is not a second codebase or a later port. There is no "web version" and "app version" to keep in sync; there is one Next.js app that ships to a URL and to Play.

**Why Capacitor over the alternatives:**

- **vs. React Native / Expo** — a rewrite means maintaining a separate native codebase and losing MapLibre GL JS, for no gain on a map-and-lookup app
- **vs. TWA (Bubblewrap / PWABuilder)** — thinner and easier, but it's just the website in a Chrome shell: weak offline support and no native plugins. Ruled out because offline is a core requirement (§6).
- **Capacitor** — one codebase, real native shell, produces an AAB for Play, and gives access to native geolocation, filesystem, and network-status detection

**Hard constraint, and the reason this matters from commit one:** Capacitor requires `output: 'export'` in `next.config.ts` — static export. That means:

- No API routes / route handlers
- No server components doing dynamic data fetching
- No server-side rendering
- No `next/image` optimization (needs `images: { unoptimized: true }`)

Set `output: 'export'` at project init and never remove it. The expensive failure mode is building for weeks on server components and discovering the constraint later — at that point the fix is a partial rewrite. With the flag on from the start, the constraint is invisible because you never write incompatible code.

Everything this app does is client-side anyway: OSRM and Nominatim are called from the browser, and the fare/zone/route data is bundled JSON.

**Add Capacitor once there are one or two working screens** — not at the end. Getting a debug APK onto a real phone early surfaces webview and touch-behaviour issues while they're still cheap to fix.

---

## 6. Offline support

This is the main reason to go native rather than PWA-only. Data coverage in Minuyan, Towerville, and upper Sapang Palay is patchy — and those are exactly the areas where someone needs to check a fare.

- **Fare matrix, zone table, TODA list** — plain JSON, bundled in the app. Fully offline. Easy.
- **Map tiles** — the hard part. OSM's tile usage policy prohibits bulk downloading, so aggressive caching is not an option.
  - Solution: **PMTiles**. Generate a single-file tile archive from an SJDM OSM extract, at a constrained zoom range. MapLibre GL JS reads PMTiles directly.
  - Ship it in the bundle, or download once on first launch to the filesystem via Capacitor's Filesystem plugin.
- Detect network state and degrade gracefully: fare lookup and cached routes work offline; live OSRM routing and Nominatim search show a clear offline notice rather than failing silently.

---

## 7. Data still needed

| Data | Source | Status |
|---|---|---|
| Tricycle fare matrix | CSJDM TRU (ordinance annex) | **Requested, awaiting reply** |
| Zone list + barangay coverage | CSJDM TRU | **Requested, awaiting reply** |
| TODA masterlist with zones | CSJDM TRU | **Requested, awaiting reply** |
| Current Tricycle Code | CSJDM TRU / Sangguniang Panlungsod | **Requested, awaiting reply** |
| City boundary GeoJSON | OSM relation | Available now |
| Barangay polygons | OSM | Available now, coverage may be patchy — verify |
| PUV routes + stops | Field survey + GPS logging | Not started |
| Landmarks | Manual + OSM | Not started |

Fallback if TRU doesn't respond within ~2 weeks of the email: file the same request via foi.gov.ph, which starts a legal response clock.

PUV routes are LTFRB-franchised, not city-regulated, so that work is **independent of the TRU reply** and can proceed immediately.

Route list is Jerome's to define — he's the resident and knows which corridors actually matter. Operators known to serve SJDM include CEM Trans Services and its sister company Joanna Jesh Transport, running the Quirino Highway corridor toward Caloocan, Quezon City, and points south. **Confirm every route on the ground before it ships.** Do not populate route data from web sources or from operator marketing material — ride it, log it, verify the stops.

Same rule as the fare matrix: an unverified route is worse than a missing one.

---

## 8. Suggested build order

Work that doesn't depend on the TRU reply comes first. See [`PROGRESS.md`](./PROGRESS.md) for current status against this build order.

**Phase 1 — scaffold and the parts nothing blocks**
1. Init the Next.js project with `output: 'export'`, TypeScript strict, and Tailwind. Verify `next build` produces a static bundle before writing feature code.
2. Base map screen with MapLibre + OSM tiles
3. City boundary layer — as an anchor, not a mask (§3b). Used as a hard limit for the tricycle calculator only.
4. Zone-lookup module with an **empty** data file — structure it so that filling in the matrix later is a JSON edit, not a rewrite of the calculator
5. "Fare data pending" UI state
6. Deploy to Vercel. A live URL is worth having early: it's the preview link for TRU, and Play requires a hosted privacy policy anyway.

**Phase 2 — mobile shell**
7. Add Capacitor, get a debug APK onto a real device
8. Native geolocation via Capacitor Geolocation
9. Network-state detection and offline UI states
10. PMTiles generation and offline map loading — extract must cover the outbound corridors to their termini, not just the city polygon

**Phase 3 — route explorer**
11. PUV route data model (GeoJSON LineString + stops, shape below), OSRM-snapped to real roads for accuracy
12. Route explorer UI: expand/collapse stops, per-route visibility toggles, dashed lines for alternate routings, shared-stop indicators where routes overlap, tap-to-fly-to-stop, lighter styling beyond the city line
13. Per-route contributor credits and `verifiedOn` staleness indicator — this is crowd-sourced data and attribution matters for trust

**Phase 4 — release**
14. Privacy policy page (required by Play even when collecting nothing — write an honest short one saying exactly that)
15. Play Console setup, closed testing track, recruit testers
16. 14-day closed test, then apply for production

**Explicitly out of scope for v1:** background location tracking / crowd-sourced live vehicle positions. Play scrutinizes background location hard and requires a written justification plus a demo video. Keep it out until the app is shipped and stable.

---

## 9. Data shapes

Superseded by what's actually implemented (see §3's status update) — the zone/TODA shapes below were the pre-data plan and were never built; deleted from the codebase (`src/data/todas.ts`, the `Toda`/`TricycleZone`/`FareEntry` types) rather than left as dead code. The real shapes, matching `src/types/tricycle.ts` and `src/lib/fare-lookup.ts`:

```typescript
type PassengerType = 'regular' | 'discounted'  // discounted: senior, PWD, student
type GasolinePriceBracket = '30-50' | '51-70' | '71-90' | '91-110'
type TripType = 'regular' | 'special'
type DistanceSource = 'road' | 'straight_line'  // 'straight_line' = offline or OSRM unreachable; FarePanel gives this its own warning state, not a footnote

interface FareScheduleEntry {
  bracket: GasolinePriceBracket
  firstTwoKmFare: number
  succeedingKmFarePerPassenger: number
  specialTripOnePassengerFare: number
  discountedRegularTripFare: number    // ordinance's own flat figure, NOT firstTwoKmFare * 0.8
  discountedSpecialTripFare: number    // same — see fare-schedule.ts's warning comment
  // ...plus a few more fields transcribed for a complete record but not
  // read by the calculator yet (specialTripTwoPassengersFareEach, etc.)
}

interface FareResult {
  fare: number                              // always resolves — see distanceSource for confidence
  distanceKm: number
  distanceSource: DistanceSource
  routeGeometry: GeoJSON.LineString | null  // OSRM road path, for drawing the trip; null when distanceSource is 'straight_line'
  bracket: GasolinePriceBracket
  tripType: TripType
  ordinanceReference: string
}
```

There is no `status: 'data_pending'` branch anymore — the fare schedule was obtained (`public/fare-matrix-2022.jpg`) and the calculator always resolves a number. What replaced "say I don't know" is `distanceSource`: a `'straight_line'` result is real fare math on a worse (shorter) distance estimate, surfaced to the passenger as a warning rather than hidden behind a plain footnote.

PUV routes — note there are **no fare fields on any of these types**, by design (§3b):

```typescript
type VehicleType = 'bus' | 'jeepney' | 'modern_jeepney'

interface RouteStop {
  id: string
  name: string
  coords: [number, number]      // [longitude, latitude]
  isOutsideCity: boolean        // drives lighter styling beyond the SJDM line
  isTerminus: boolean           // handoff point — app's coverage ends here
  sharedWithRouteIds?: string[] // for multi-route indicators at junctions
}

interface AlternateRoute {
  id: string
  name: string
  description?: string
  geojson: GeoJSON.Feature<GeoJSON.LineString>
  stops?: RouteStop[]
}

interface PuvRoute {
  id: string
  name: string
  vehicleTypes: VehicleType[]   // a corridor is often served by more than one
  color: string
  bidirectional: boolean
  geojson: GeoJSON.Feature<GeoJSON.LineString>
  stops: RouteStop[]
  alternateRoutes?: AlternateRoute[]
  operators?: string[]
  contributor?: string          // credited in the UI via an info icon
  verifiedOn?: string           // ISO date the route was last confirmed on the ground
}
```

`vehicleTypes` is an array on purpose. From a passenger's point of view a corridor is one option set — you board whatever arrives first heading to Fairview. Splitting bus and jeepney into separate features would be an operator's distinction, not a commuter's.

`verifiedOn` is not decorative — PUV routes change without notice. A route that hasn't been re-checked in a long time should be visibly flagged as possibly stale rather than presented as current.

---

## 10. Conventions

Follow the existing `coding-standards` skill. Highlights that matter most here:

- TypeScript strict, no `any`
- Descriptive names, verb-noun for functions (`calculateZoneFare`, not `fare`)
- Immutability by default — spread, never mutate
- Named constants over magic numbers, especially anywhere near fare logic
- Early returns over deep nesting
- Comprehensive error handling on every external API call (OSRM and Nominatim are public demo servers under fair-use policies and *will* fail intermittently)
- Comment the WHY, not the WHAT — the zone-fare logic in particular needs comments explaining the ordinance basis for each rule

---

## 11. Things to hold onto

- Every fare shown must cite its ordinance on screen. Users should be able to see the legal basis, and drivers should be able to verify it.
- Attribution: OpenStreetMap contributors (required), CSJDM TRU if they supply the data, GenSan Transport as inspiration, and route contributors by name.
- If TRU responds, offer to show them a preview before public launch. They carry the risk if the numbers are wrong under their name, and a preview turns the project from a liability into a collaboration.
- MRT-7's northern terminus is planned for SJDM (Tungkong Mangga / near the Caloocan boundary), built to serve exactly the outbound flow this app models. Modelling routes as SJDM-to-elsewhere corridors from the start means rail slots in later as another corridor rather than forcing a rework. No need to build for it now — just don't design it out.
