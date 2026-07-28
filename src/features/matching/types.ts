import type { TripWithDriver } from "@/features/trips/types";
import type { LatLng } from "@/lib/geo";

/**
 * Everything the scoring engine needs about the passenger's intent that ISN'T already
 * on the candidate trip itself. All fields are optional/nullable because a passenger
 * doesn't always have all of this available (e.g. browsing the home feed with no
 * search yet) — see docs/05-matching.md "graceful degradation".
 */
export interface MatchingContext {
  searchOrigin: LatLng | null;
  searchDestination: LatLng | null;
  /** ISO timestamp of when the passenger wants to depart, if they specified one. */
  desiredDepartureAt: string | null;
  /** Driver ids the passenger has completed at least one trip with before. */
  knownDriverIds: ReadonlySet<string>;
}

export const EMPTY_MATCHING_CONTEXT: MatchingContext = {
  searchOrigin: null,
  searchDestination: null,
  desiredDepartureAt: null,
  knownDriverIds: new Set(),
};

export interface ScoreBreakdown {
  pickupDistance: number | null;
  destinationDistance: number | null;
  departureTime: number | null;
  detour: number | null;
  duration: number | null;
  price: number;
  driverRating: number;
  punctuality: number | null;
  knownDriver: number;
}

export interface ScoredTrip extends TripWithDriver {
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
}
