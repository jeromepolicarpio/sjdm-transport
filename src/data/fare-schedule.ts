import type { FareScheduleEntry } from "@/types/tricycle";

// Transcribed verbatim from the published fare matrix under City Ordinance
// No. 2022-107-06 (public/fare-matrix-2022.jpg). CSJDM Tricycle Regulatory
// Unit has been asked whether a newer matrix supersedes this one and has not
// replied — see docs/HANDOFF.md §3. DO NOT derive or round any of these
// figures from another column; the discount amounts in particular are the
// ordinance's own flat figures, not an exact 20% of the base fare.
export const fareSchedule: FareScheduleEntry[] = [
  {
    bracket: "30-50",
    minGasolinePrice: 30,
    maxGasolinePrice: 50,
    firstTwoKmFare: 10.0,
    succeedingKmFarePerPassenger: 1.0,
    specialTripOnePassengerFare: 30.0,
    specialTripTwoPassengersFareEach: 15.0,
    regularTripThreePassengersFareEach: 10.0,
    additionalPassengerFare: 10.0,
    discountedRegularTripFare: 8.0,
    discountedSpecialTripFare: 24.0,
  },
  {
    bracket: "51-70",
    minGasolinePrice: 51,
    maxGasolinePrice: 70,
    firstTwoKmFare: 11.0,
    succeedingKmFarePerPassenger: 1.0,
    specialTripOnePassengerFare: 33.0,
    specialTripTwoPassengersFareEach: 16.5,
    regularTripThreePassengersFareEach: 11.0,
    additionalPassengerFare: 11.0,
    discountedRegularTripFare: 9.0,
    discountedSpecialTripFare: 26.5,
  },
  {
    bracket: "71-90",
    minGasolinePrice: 71,
    maxGasolinePrice: 90,
    firstTwoKmFare: 12.0,
    succeedingKmFarePerPassenger: 1.0,
    specialTripOnePassengerFare: 36.0,
    specialTripTwoPassengersFareEach: 18.0,
    regularTripThreePassengersFareEach: 12.0,
    additionalPassengerFare: 12.0,
    discountedRegularTripFare: 10.0,
    discountedSpecialTripFare: 29.0,
  },
  {
    bracket: "91-110",
    minGasolinePrice: 91,
    maxGasolinePrice: 110,
    firstTwoKmFare: 13.0,
    succeedingKmFarePerPassenger: 1.0,
    specialTripOnePassengerFare: 39.0,
    specialTripTwoPassengersFareEach: 19.5,
    regularTripThreePassengersFareEach: 13.0,
    additionalPassengerFare: 13.0,
    discountedRegularTripFare: 11.0,
    discountedSpecialTripFare: 31.0,
  },
];

// NOT an ordinance figure — do not treat this alongside the transcribed
// numbers above. The ordinance scopes the flat special-trip rate to a TODA's
// "designated zone of operation" but publishes no zone boundaries, and the
// CSJDM TRU zone masterlist is still unreceived (docs/HANDOFF.md §3). This is
// the app's own conservative guess at how long a special trip can run before
// it has probably left that zone, used ONLY to decide whether to warn the
// user that ordinance note (iv) — "All destination outside the Zone, depends
// between the agreement of the Drivers and passengers" — probably applies.
// Delete this and check the real boundary if the zone data ever arrives.
export const SPECIAL_TRIP_IN_ZONE_MAX_KM = 3;
