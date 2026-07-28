import type { TripWithDriver } from "@/features/trips/types";
import {
  crossTrackDistanceKm,
  estimateDurationMinutes,
  haversineDistanceKm,
} from "@/lib/geo";

import { EMPTY_MATCHING_CONTEXT } from "./types";
import type { MatchingContext, ScoreBreakdown, ScoredTrip } from "./types";

/**
 * Weight (out of 100) each factor contributes to the final compatibility score.
 * Tunable in one place — see docs/05-matching.md for the reasoning behind each number
 * and how this whole module would be replaced by a trained model later.
 */
export const MATCH_WEIGHTS = {
  pickupDistance: 20,
  destinationDistance: 20,
  departureTime: 15,
  detour: 12,
  duration: 8,
  price: 10,
  driverRating: 8,
  punctuality: 5,
  knownDriver: 2,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear falloff: `full` score at 0 distance, 0 at `zeroAtKm` or beyond. */
function distanceToScore(distanceKm: number, zeroAtKm: number): number {
  return clamp(100 - (distanceKm / zeroAtKm) * 100, 0, 100);
}

function pickupDistanceScore(trip: TripWithDriver, context: MatchingContext): number | null {
  if (!context.searchOrigin) return null;
  const distanceKm = haversineDistanceKm(context.searchOrigin, {
    lat: trip.trip.origin_lat,
    lng: trip.trip.origin_lng,
  });
  return distanceToScore(distanceKm, 10);
}

function destinationDistanceScore(trip: TripWithDriver, context: MatchingContext): number | null {
  if (!context.searchDestination) return null;
  const distanceKm = haversineDistanceKm(context.searchDestination, {
    lat: trip.trip.destination_lat,
    lng: trip.trip.destination_lng,
  });
  return distanceToScore(distanceKm, 10);
}

function departureTimeScore(trip: TripWithDriver, context: MatchingContext): number | null {
  if (!context.desiredDepartureAt) return null;
  const diffMinutes =
    Math.abs(new Date(trip.trip.departure_at).getTime() - new Date(context.desiredDepartureAt).getTime()) /
    60_000;
  return clamp(100 - (diffMinutes / 180) * 100, 0, 100); // full score at 0 min, 0 at >=3h
}

/**
 * How far the passenger's desired pickup point sits from the driver's direct
 * origin→destination line — a proxy for "would the driver need to go out of their way".
 */
function detourScore(trip: TripWithDriver, context: MatchingContext): number | null {
  if (!context.searchOrigin) return null;
  const crossTrackKm = crossTrackDistanceKm(
    context.searchOrigin,
    { lat: trip.trip.origin_lat, lng: trip.trip.origin_lng },
    { lat: trip.trip.destination_lat, lng: trip.trip.destination_lng }
  );
  return distanceToScore(crossTrackKm, 5);
}

/**
 * Compares the trip's own (haversine-estimated) ride time against the passenger's own
 * direct origin→destination time. A trip that takes much longer than the passenger's
 * own direct route implies either a very indirect road route or (in a future version
 * with real stops) other passengers' detours stacking up.
 */
function durationScore(trip: TripWithDriver, context: MatchingContext): number | null {
  if (!context.searchOrigin || !context.searchDestination) return null;

  const directDurationMin = estimateDurationMinutes(
    haversineDistanceKm(context.searchOrigin, context.searchDestination)
  );
  if (directDurationMin === 0) return null;

  const tripDurationMin = estimateDurationMinutes(
    haversineDistanceKm(
      { lat: trip.trip.origin_lat, lng: trip.trip.origin_lng },
      { lat: trip.trip.destination_lat, lng: trip.trip.destination_lng }
    )
  );

  const ratio = tripDurationMin / directDurationMin;
  if (ratio <= 1.2) return 100;
  return clamp(100 - ((ratio - 1.2) / 1.3) * 100, 0, 100); // reaches 0 around 2.5x
}

/** Cheapest candidate in the batch scores ~100, priciest scores ~0; a single price (or all equal) scores 100. */
function priceScore(trip: TripWithDriver, allTrips: TripWithDriver[]): number {
  const prices = allTrips.map((item) => item.trip.price_per_seat);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  if (range === 0) return 100;
  return clamp(100 - ((trip.trip.price_per_seat - minPrice) / range) * 100, 0, 100);
}

/** New drivers (no ratings yet) get a neutral score instead of being punished for having 0.00. */
function driverRatingScore(trip: TripWithDriver): number {
  if (trip.driver.rating_count === 0) return 70;
  return clamp((trip.driver.rating_avg / 5) * 100, 0, 100);
}

function punctualityScore(trip: TripWithDriver): number | null {
  if (!trip.driverStats) return null;
  return clamp(trip.driverStats.punctuality_score, 0, 100);
}

function knownDriverScore(trip: TripWithDriver, context: MatchingContext): number {
  return context.knownDriverIds.has(trip.trip.driver_id) ? 100 : 0;
}

/**
 * Weighted average over whichever factors have a non-null score, renormalized so
 * missing context (e.g. no search origin yet) never drags the score down — see
 * docs/05-matching.md "graceful degradation".
 */
function combineScores(entries: { weight: number; score: number | null }[]): number {
  const applicable = entries.filter(
    (entry): entry is { weight: number; score: number } => entry.score !== null
  );
  const totalWeight = applicable.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return 50; // no usable signal at all: neutral score

  const weightedSum = applicable.reduce((sum, entry) => sum + entry.weight * entry.score, 0);
  return Math.round(weightedSum / totalWeight);
}

function scoreTrip(
  trip: TripWithDriver,
  context: MatchingContext,
  allTrips: TripWithDriver[]
): ScoredTrip {
  const breakdown: ScoreBreakdown = {
    pickupDistance: pickupDistanceScore(trip, context),
    destinationDistance: destinationDistanceScore(trip, context),
    departureTime: departureTimeScore(trip, context),
    detour: detourScore(trip, context),
    duration: durationScore(trip, context),
    price: priceScore(trip, allTrips),
    driverRating: driverRatingScore(trip),
    punctuality: punctualityScore(trip),
    knownDriver: knownDriverScore(trip, context),
  };

  const matchScore = combineScores([
    { weight: MATCH_WEIGHTS.pickupDistance, score: breakdown.pickupDistance },
    { weight: MATCH_WEIGHTS.destinationDistance, score: breakdown.destinationDistance },
    { weight: MATCH_WEIGHTS.departureTime, score: breakdown.departureTime },
    { weight: MATCH_WEIGHTS.detour, score: breakdown.detour },
    { weight: MATCH_WEIGHTS.duration, score: breakdown.duration },
    { weight: MATCH_WEIGHTS.price, score: breakdown.price },
    { weight: MATCH_WEIGHTS.driverRating, score: breakdown.driverRating },
    { weight: MATCH_WEIGHTS.punctuality, score: breakdown.punctuality },
    { weight: MATCH_WEIGHTS.knownDriver, score: breakdown.knownDriver },
  ]);

  return { ...trip, matchScore, scoreBreakdown: breakdown };
}

/**
 * Scores and sorts a batch of trips against a passenger's matching context. This is the
 * one function the rest of the app depends on — swap its implementation for a trained
 * model's inference call without touching any component (see docs/05-matching.md).
 */
export function scoreTrips(
  trips: TripWithDriver[],
  context: MatchingContext = EMPTY_MATCHING_CONTEXT
): ScoredTrip[] {
  return trips
    .map((trip) => scoreTrip(trip, context, trips))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function getRecommendedTrips(
  trips: TripWithDriver[],
  context: MatchingContext = EMPTY_MATCHING_CONTEXT,
  limit = 5
): ScoredTrip[] {
  return scoreTrips(trips, context).slice(0, limit);
}
