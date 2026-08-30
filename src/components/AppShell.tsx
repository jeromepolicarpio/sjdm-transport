"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AboutModal } from "@/components/AboutModal";
import { AppHeader } from "@/components/AppHeader";
import { CityMap } from "@/components/CityMap";
import type { CityMapHandle } from "@/components/CityMap";
import { DisclaimerCard } from "@/components/DisclaimerCard";
import { FareMatrixModal } from "@/components/FareMatrixModal";
import { FarePickerHint } from "@/components/FarePickerHint";
import { FareResultCard } from "@/components/FareResultCard";
import { MapLegend } from "@/components/MapLegend";
import { MenuDrawer } from "@/components/MenuDrawer";
import { NavRail } from "@/components/NavRail";
import { OfflineBanner } from "@/components/OfflineBanner";
import { FarePanel } from "@/components/panels/FarePanel";
import { RoutesPanel } from "@/components/panels/RoutesPanel";
import { StartEndBar } from "@/components/StartEndBar";
import { calculateFare } from "@/lib/fare-lookup";
import { getCurrentLngLat } from "@/lib/geolocate";
import type { LngLat } from "@/lib/haversine";
import { pendingFarePoint, resolveFarePoint } from "@/lib/resolve-fare-point";
import { useNetworkStatus } from "@/lib/use-network-status";
import { puvRoutes } from "@/data/puv-routes";
import { TAB_LABELS } from "@/types/app-tab";
import type { AppTab } from "@/types/app-tab";
import type { RouteStop } from "@/types/puv-route";
import type {
  FareField,
  FarePoint,
  FareResult,
  GasolinePriceBracket,
  PassengerType,
  TripType,
} from "@/types/tricycle";

// Stable empty-set reference so the CityMap prop identity doesn't change
// every render while the Trike Fare tab is active (it hides bus/jeep routes
// there — they're a different feature and would clutter the fare picker).
const EMPTY_ROUTE_IDS: ReadonlySet<string> = new Set();

export function AppShell() {
  const mapRef = useRef<CityMapHandle>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("fare");
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(
    () => new Set(puvRoutes.map((route) => route.id)),
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [darkOverlay, setDarkOverlay] = useState(false);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [isFareMatrixOpen, setIsFareMatrixOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [origin, setOrigin] = useState<FarePoint | null>(null);
  const [destination, setDestination] = useState<FarePoint | null>(null);
  const isOnline = useNetworkStatus();

  // Fare-selector state lives here, not in FarePanel: FarePanel is mounted
  // TWICE simultaneously (desktop sidebar + mobile bottom sheet — CSS
  // hidden/md:hidden toggles visibility, it doesn't unmount either one).
  // State/effects that lived inside FarePanel used to run independently in
  // each instance — two OSRM requests per calculation, and the two copies
  // could show different selections. Single source of truth here; FarePanel
  // becomes presentational.
  const [passengerType, setPassengerType] = useState<PassengerType>("regular");
  const [tripType, setTripType] = useState<TripType>("regular");
  const [bracket, setBracket] = useState<GasolinePriceBracket>("91-110");
  // Keyed rather than a plain FareResult: lets `result`/`isCalculating`
  // below be *derived* (does the stored key match this render's inputs?)
  // instead of needing a separate isCalculating flag set synchronously at
  // the top of an effect — react-hooks' set-state-in-effect rule flags
  // exactly that "loading = true" kickoff. Setting state only from the
  // .then callback (genuinely async) satisfies it, and this also resets
  // stale results for free: clearing a point or changing the bracket
  // changes the key, so an old result stops matching with no explicit
  // reset branch needed.
  const [computed, setComputed] = useState<{ key: string; result: FareResult } | null>(
    null,
  );

  // Which PlacePickerMenu is open — lifted for the same reason as above:
  // FarePanel and StartEndBar are both mounted at once, so an unlifted
  // isOpen would let both surfaces show a menu simultaneously.
  const [openPickerField, setOpenPickerField] = useState<FareField | null>(null);
  // Explicit re-arm: normally pickingField (below) is purely derived from
  // which point is unset, so once both are set the map disarms and there is
  // no way to change just one of them without clearing it first. Choosing
  // "Select on Map" in a menu for an already-set field sets this to arm the
  // map for THAT field specifically; handlePickPoint clears it once
  // consumed so the derived behavior resumes.
  const [pickingOverride, setPickingOverride] = useState<FareField | null>(null);
  // "use my location" is triggered from either FarePointRow's menu; lifted
  // alongside handleUseMyLocation below for the same double-mount reason as
  // passengerType/tripType/bracket/computed above — it used to be
  // per-surface state in StartEndBar and FarePanel, which could show
  // different errors for the same failed attempt.
  const [locateError, setLocateError] = useState<string | null>(null);

  // Picking is derived except for pickingOverride: whichever of origin/
  // destination is still unset is what a map tap sets next, by default —
  // this is what makes the flow "tap map, tap map" with no arm/re-arm
  // button, matching the reference screenshot's always-on prompt. The
  // override above takes priority so "Select on Map" can target a field
  // that's already set.
  const pickingField: FareField | null =
    activeTab !== "fare"
      ? null
      : (pickingOverride ?? (!origin ? "origin" : !destination ? "destination" : null));

  const originCoords = origin && !origin.isResolving ? origin.coords : null;
  const destinationCoords =
    destination && !destination.isResolving ? destination.coords : null;
  const requestKey =
    originCoords && destinationCoords
      ? `${originCoords.lng},${originCoords.lat}|${destinationCoords.lng},${destinationCoords.lat}|${bracket}|${tripType}|${passengerType}`
      : null;
  const result = requestKey && computed?.key === requestKey ? computed.result : null;
  const isCalculating = requestKey !== null && result === null;
  // Derived, not separate state — see `computed` above for why. This also
  // means a route line/camera frame is only ever based on a geometry that
  // actually matches the current inputs, never a stale one from a previous
  // pick or selector change.
  const fareRouteGeometry = result?.routeGeometry ?? null;

  // Per-field so a fresh tap on one point can cancel that point's own
  // in-flight resolve without touching the other (they can resolve
  // concurrently once auto-advance lets the user tap both in quick
  // succession).
  const originAbortRef = useRef<AbortController | null>(null);
  const destinationAbortRef = useRef<AbortController | null>(null);
  // Dedupes frameFareTrip: fires once per distinct resolved origin+destination
  // pair (and again, once, when road-route geometry first arrives for that
  // same pair — so a long detour that would otherwise render partly
  // offscreen gets one corrective re-fit), not on every fare-schedule/
  // trip-type re-render once both are set.
  const framedKeyRef = useRef<string | null>(null);
  // So frameFareTrip can pad the camera fit by exactly how much of the map
  // the mobile fare card covers — the card has no fixed height, and
  // measuring it beats guessing a constant that drifts as its content
  // changes. Read fresh (not from state) at call time in the effect below.
  const fareResultCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // react-hooks/exhaustive-deps assumes refs are DOM nodes captured once;
    // these are mutable AbortController refs that intentionally read
    // whatever the *latest* in-flight controller is at unmount time, not a
    // value snapshotted at mount — copying `.current` into a local here
    // would abort nothing, since handlePickPoint reassigns it long after.
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      originAbortRef.current?.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      destinationAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!originCoords || !destinationCoords || !requestKey) return;

    const controller = new AbortController();

    calculateFare(
      originCoords,
      destinationCoords,
      bracket,
      tripType,
      passengerType,
      isOnline,
      controller.signal,
    )
      .then((fareResult) => {
        if (!controller.signal.aborted) {
          setComputed({ key: requestKey, result: fareResult });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [
    originCoords,
    destinationCoords,
    requestKey,
    bracket,
    tripType,
    passengerType,
    isOnline,
  ]);

  const handleToggleRoute = (routeId: string) => {
    setVisibleRouteIds((current) => {
      const next = new Set(current);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const handleSelectRoute = (routeId: string | null) => {
    setSelectedRouteId(routeId);
    if (routeId) mapRef.current?.fitToRoute(routeId);
  };

  const handleStopSelect = (stop: RouteStop) => {
    mapRef.current?.flyTo(stop.coords);
  };

  const handleToggleDarkOverlay = (value: boolean) => {
    setDarkOverlay(value);
    mapRef.current?.setDarkOverlay(value);
  };

  const handlePickPoint = (field: FareField, rawCoords: LngLat) => {
    // Consume the override once it's acted on — otherwise pickingField
    // would stay pinned to this field forever instead of resuming the
    // derived tap-tap flow.
    if (pickingOverride === field) setPickingOverride(null);

    const abortRef = field === "origin" ? originAbortRef : destinationAbortRef;
    const setPoint = field === "origin" ? setOrigin : setDestination;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Pin drops immediately at the raw tap, unresolved — the snap/geocode
    // result replaces it once it lands, rather than leaving the map blank
    // while "Finding location…" is still just a label with no pin yet.
    setPoint(pendingFarePoint(rawCoords));

    if (!isOnline) {
      // Snapping and reverse geocoding both need network; skip straight to
      // coords-only rather than waiting out an 8s timeout for something
      // that's certain to fail.
      setPoint({ coords: rawCoords, label: null, district: null, isResolving: false });
      return;
    }

    resolveFarePoint(rawCoords, controller.signal).then((resolved) => {
      if (!controller.signal.aborted) setPoint(resolved);
    });
  };

  const handleClearPoint = (field: FareField) => {
    const abortRef = field === "origin" ? originAbortRef : destinationAbortRef;
    abortRef.current?.abort();
    if (field === "origin") setOrigin(null);
    else setDestination(null);
  };

  const handleClearBothPoints = () => {
    handleClearPoint("origin");
    handleClearPoint("destination");
    // Counterpart to the framing effect below: the trip that justified the
    // tight fitBounds is gone, so return to the city view. Clearing the key
    // too means re-picking the SAME pair re-frames instead of early-
    // returning on a stale match.
    framedKeyRef.current = null;
    mapRef.current?.resetView();
  };

  // A place picked from PlacePickerMenu already has a trusted name and
  // coordinate (a verified PUV stop, or a Photon search hit the user
  // explicitly chose) — set it directly rather than routing it through
  // resolveFarePoint. Snapping it to the nearest road could shift a known
  // terminal off its actual position, and reverse-geocoding it could
  // replace a good name with a worse one.
  const handleSelectPlace = (field: FareField, name: string, coords: LngLat) => {
    if (pickingOverride === field) setPickingOverride(null);
    const abortRef = field === "origin" ? originAbortRef : destinationAbortRef;
    abortRef.current?.abort();
    const setPoint = field === "origin" ? setOrigin : setDestination;
    setPoint({ coords, label: name, district: null, isResolving: false });
  };

  const handleUseMyLocation = async (field: FareField) => {
    setLocateError(null);
    try {
      const point = await getCurrentLngLat();
      handlePickPoint(field, point);
    } catch (error: unknown) {
      setLocateError(error instanceof Error ? error.message : "Unable to get your location");
    }
  };

  const handleTogglePicker = (field: FareField) => {
    setOpenPickerField((current) => (current === field ? null : field));
  };

  const handleClosePicker = () => setOpenPickerField(null);

  const handleSelectOnMap = (field: FareField) => setPickingOverride(field);

  // Frames the trip once both points have finished resolving, then again
  // once (per framedKeyRef's key including whether geometry has arrived)
  // when the road route comes in — not gated on waiting for that geometry
  // up front: frameFareTrip's bounds computation already falls back to the
  // two points when there's none yet, so the camera move happens promptly
  // rather than waiting on routing every time.
  useEffect(() => {
    if (activeTab !== "fare" || !origin || !destination) return;
    if (origin.isResolving || destination.isResolving) return;

    const key = `${origin.coords.lng},${origin.coords.lat}|${destination.coords.lng},${destination.coords.lat}|geo:${fareRouteGeometry ? "1" : "0"}`;
    if (framedKeyRef.current === key) return;
    framedKeyRef.current = key;

    const cardOverlayPx = fareResultCardRef.current?.getBoundingClientRect().height ?? 0;
    mapRef.current?.frameFareTrip(fareRouteGeometry, origin.coords, destination.coords, cardOverlayPx);
  }, [activeTab, origin, destination, fareRouteGeometry]);

  const renderPanel = () => {
    switch (activeTab) {
      case "routes":
        return (
          <RoutesPanel
            routes={puvRoutes}
            visibleRouteIds={visibleRouteIds}
            onToggleRoute={handleToggleRoute}
            onStopSelect={handleStopSelect}
            selectedRouteId={selectedRouteId}
            onSelectRoute={handleSelectRoute}
          />
        );
      case "fare":
        return (
          <FarePanel
            origin={origin}
            destination={destination}
            openPickerField={openPickerField}
            onTogglePicker={handleTogglePicker}
            onClosePicker={handleClosePicker}
            onUseCurrentLocation={handleUseMyLocation}
            onSelectOnMap={handleSelectOnMap}
            onSelectPlace={handleSelectPlace}
            onClearPoint={handleClearPoint}
            isOnline={isOnline}
            locateError={locateError}
            passengerType={passengerType}
            onPassengerTypeChange={setPassengerType}
            bracket={bracket}
            onBracketChange={setBracket}
            tripType={tripType}
            onTripTypeChange={setTripType}
            result={result}
            isCalculating={isCalculating}
            onViewFareMatrix={() => setIsFareMatrixOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h1 className="sr-only">
        SJDM Transport — PUV route map and tricycle fare calculator for San
        Jose del Monte, Bulacan
      </h1>
      <AppHeader onMenuOpen={() => setIsMenuOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Persistent desktop nav + content surface. Renders on BOTH tabs
            (unlike the mobile surfaces below, which are fare/routes-specific)
            — NavRail replaces MenuDrawer as the desktop nav (icon rail:
            logo, tab tiles, quick links pinned to the bottom), and
            renderPanel()'s "fare" case reuses the same FarePanel body that
            used to only exist as StartEndBar + floating FareResultCard. */}
        <aside className="hidden min-h-0 md:flex">
          <NavRail
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onViewFareMatrix={() => setIsFareMatrixOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
          <div className="flex w-80 min-h-0 flex-col border-r border-slate-200 bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto">{renderPanel()}</div>
            <DisclaimerCard />
          </div>
        </aside>

        {/* min-w-0 matters here: without it, a long place name's nowrap
            truncate span deep in StartEndBar (or the map canvas's own inline
            pixel width) sets this flex item's min-content width instead of
            letting it shrink to the viewport — pushing StartEndBar, the map,
            and the fare card past the screen edge. */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {activeTab === "fare" && (
            <StartEndBar
              origin={origin}
              destination={destination}
              openPickerField={openPickerField}
              onTogglePicker={handleTogglePicker}
              onClosePicker={handleClosePicker}
              onUseCurrentLocation={handleUseMyLocation}
              onSelectOnMap={handleSelectOnMap}
              onSelectPlace={handleSelectPlace}
              onClearPoint={handleClearPoint}
              isOnline={isOnline}
              locateError={locateError}
            />
          )}

          <div className="relative min-h-0 flex-1">
            <CityMap
              ref={mapRef}
              routes={puvRoutes}
              visibleRouteIds={activeTab === "fare" ? EMPTY_ROUTE_IDS : visibleRouteIds}
              selectedRouteId={activeTab === "fare" ? null : selectedRouteId}
              pickingField={pickingField}
              onPickPoint={handlePickPoint}
              fareOrigin={activeTab === "fare" ? origin : null}
              fareDestination={activeTab === "fare" ? destination : null}
              fareRouteGeometry={activeTab === "fare" ? fareRouteGeometry : null}
            />
            {activeTab === "fare" && (
              <FarePickerHint origin={origin} destination={destination} pickingField={pickingField} />
            )}
            {activeTab === "fare" && origin && destination && (
              <FareResultCard
                ref={fareResultCardRef}
                origin={origin}
                destination={destination}
                passengerType={passengerType}
                onPassengerTypeChange={setPassengerType}
                bracket={bracket}
                onBracketChange={setBracket}
                tripType={tripType}
                onTripTypeChange={setTripType}
                result={result}
                isCalculating={isCalculating}
                onClose={handleClearBothPoints}
                onViewFareMatrix={() => setIsFareMatrixOpen(true)}
              />
            )}
            <OfflineBanner />
            <MapLegend darkOverlay={darkOverlay} onToggleDarkOverlay={handleToggleDarkOverlay} />

            {/* Mobile bottom sheet for routes/about — the fare tab uses
                StartEndBar + FareResultCard instead, both above. */}
            {activeTab !== "fare" && (
              <div
                className={`pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-xl border-t border-slate-200 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.1)] transition-[max-height] duration-200 md:hidden ${
                  isMobileSheetExpanded ? "max-h-[80vh]" : "max-h-[15vh]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsMobileSheetExpanded((expanded) => !expanded)}
                  aria-expanded={isMobileSheetExpanded}
                  className="flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-500"
                >
                  <span className="h-1 w-10 rounded-full bg-slate-300" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileSheetExpanded((expanded) => !expanded)}
                  className="flex items-center justify-between border-b border-slate-200 px-3 pb-2 text-sm font-semibold text-slate-800"
                >
                  {TAB_LABELS[activeTab]}
                  <ChevronUp
                    size={16}
                    className={`transition-transform duration-150 ${isMobileSheetExpanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                <div className="min-h-0 flex-1 overflow-y-auto">{renderPanel()}</div>
                {isMobileSheetExpanded && <DisclaimerCard />}
              </div>
            )}
          </div>
        </div>
      </div>

      <MenuDrawer
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onViewFareMatrix={() => setIsFareMatrixOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <FareMatrixModal
        open={isFareMatrixOpen}
        onClose={() => setIsFareMatrixOpen(false)}
      />

      <AboutModal open={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
