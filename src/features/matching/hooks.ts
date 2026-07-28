import { useQuery } from "@tanstack/react-query";

import { fetchKnownDriverIds } from "./api";
import type { MatchingContext } from "./types";

export interface MatchingContextInput {
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  /** yyyy-mm-dd */
  date?: string;
  /** HH:mm */
  time?: string;
}

/**
 * Assembles a `MatchingContext` for the current passenger: their search coordinates (if
 * any), desired departure time, and which drivers they've ridden with before. Any piece
 * that isn't available yet (no search coordinates, `knownDriverIds` still loading) is
 * simply omitted — the scoring engine renormalizes around missing factors, see
 * docs/05-matching.md.
 */
export function useMatchingContext(
  passengerId: string | undefined,
  input: MatchingContextInput = {}
): MatchingContext {
  const knownDrivers = useQuery({
    queryKey: ["matching", "knownDrivers", passengerId],
    queryFn: () => fetchKnownDriverIds(passengerId!),
    enabled: Boolean(passengerId),
  });

  const searchOrigin =
    input.originLat != null && input.originLng != null
      ? { lat: input.originLat, lng: input.originLng }
      : null;
  const searchDestination =
    input.destinationLat != null && input.destinationLng != null
      ? { lat: input.destinationLat, lng: input.destinationLng }
      : null;
  const desiredDepartureAt =
    input.date && input.time ? new Date(`${input.date}T${input.time}`).toISOString() : null;

  return {
    searchOrigin,
    searchDestination,
    desiredDepartureAt,
    knownDriverIds: knownDrivers.data ?? new Set(),
  };
}
