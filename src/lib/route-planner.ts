import { estimateDurationMinutes, haversineDistanceKm } from "./geo";
import type { LatLng } from "./geo";

export interface PickupStop {
  passengerId: string;
  label: string;
  location: LatLng;
}

export interface PlannedStop extends PickupStop {
  order: number;
  distanceFromPreviousKm: number;
  etaMinutesFromStart: number;
  etaTimestamp: string;
}

export interface RoutePlan {
  stops: PlannedStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  googleMapsUrl: string;
}

/**
 * Greedy nearest-neighbor ordering of pickup stops between a fixed start and end point.
 * This is NOT a true TSP solver — it's a well-known, cheap approximation (always pick
 * the closest remaining stop) chosen because there's no Directions API key to call
 * `optimizeWaypoints` with. Good enough for the handful of stops a carpool trip
 * actually has; see docs/06-decisiones-fase-4.md for why and how this would be
 * upgraded once a real Google Maps key exists.
 */
export function planPickupRoute(
  start: LatLng,
  end: LatLng,
  stops: PickupStop[],
  startTime: Date
): RoutePlan {
  const remaining = [...stops];
  const ordered: PlannedStop[] = [];
  let current = start;
  let cumulativeDistanceKm = 0;
  let cumulativeMinutes = 0;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistanceKm = Infinity;
    remaining.forEach((stop, index) => {
      const distanceKm = haversineDistanceKm(current, stop.location);
      if (distanceKm < nearestDistanceKm) {
        nearestDistanceKm = distanceKm;
        nearestIndex = index;
      }
    });

    const [next] = remaining.splice(nearestIndex, 1) as [PickupStop];
    const legMinutes = estimateDurationMinutes(nearestDistanceKm);
    cumulativeDistanceKm += nearestDistanceKm;
    cumulativeMinutes += legMinutes;

    ordered.push({
      ...next,
      order: ordered.length + 1,
      distanceFromPreviousKm: nearestDistanceKm,
      etaMinutesFromStart: cumulativeMinutes,
      etaTimestamp: new Date(startTime.getTime() + cumulativeMinutes * 60_000).toISOString(),
    });

    current = next.location;
  }

  const finalLegKm = haversineDistanceKm(current, end);
  cumulativeDistanceKm += finalLegKm;
  cumulativeMinutes += estimateDurationMinutes(finalLegKm);

  return {
    stops: ordered,
    totalDistanceKm: cumulativeDistanceKm,
    totalDurationMinutes: cumulativeMinutes,
    googleMapsUrl: buildGoogleMapsDeepLink(
      start,
      end,
      ordered.map((stop) => stop.location)
    ),
  };
}

/**
 * A `https://www.google.com/maps/dir/?api=1&...` deep link opens Google Maps (app or
 * web) with origin, destination and ordered waypoints pre-filled — and, unlike the
 * embedded interactive map, this needs no API key at all: it's just a URL.
 */
export function buildGoogleMapsDeepLink(start: LatLng, end: LatLng, waypoints: LatLng[]): string {
  const formatPoint = (point: LatLng) => `${point.lat},${point.lng}`;
  const params = new URLSearchParams({
    api: "1",
    origin: formatPoint(start),
    destination: formatPoint(end),
    travelmode: "driving",
  });
  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.map(formatPoint).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
