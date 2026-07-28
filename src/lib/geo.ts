export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two points, in kilometers. Used as a
 * geocoding/Directions-API-free placeholder for "distance to pickup/destination" in the
 * matching heuristic (see docs/05-matching.md) and for trip cards before a real Google
 * Directions call is wired in.
 */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function bearingRad(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x);
}

/**
 * Perpendicular ("cross-track") distance in km from `point` to the great-circle path
 * that runs through `routeStart` and `routeEnd` — i.e. how far off the driver's direct
 * route line a candidate pickup point sits. Used by the matching engine as a
 * geocoding/Directions-API-free proxy for "how much of a detour is this passenger for
 * the driver" (see docs/05-matching.md).
 *
 * This measures distance to the infinite line through the two points, not to the
 * segment — a point far beyond `routeStart` or `routeEnd` can still read as "on the
 * route". Good enough for a relative 0–100 score; a real routing engine (Fase 4+) would
 * replace this with an actual detour computed from the Directions API.
 */
export function crossTrackDistanceKm(point: LatLng, routeStart: LatLng, routeEnd: LatLng): number {
  if (routeStart.lat === routeEnd.lat && routeStart.lng === routeEnd.lng) {
    return haversineDistanceKm(point, routeStart);
  }

  const angularDistanceStartToPoint = haversineDistanceKm(routeStart, point) / EARTH_RADIUS_KM;
  const bearingStartToPoint = bearingRad(routeStart, point);
  const bearingStartToEnd = bearingRad(routeStart, routeEnd);

  const crossTrackAngular = Math.asin(
    Math.sin(angularDistanceStartToPoint) * Math.sin(bearingStartToPoint - bearingStartToEnd)
  );
  return Math.abs(crossTrackAngular * EARTH_RADIUS_KM);
}

/** Rough duration estimate (minutes) assuming an average urban driving speed of 35 km/h. */
export function estimateDurationMinutes(distanceKm: number): number {
  const AVERAGE_SPEED_KMH = 35;
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);
}

export function formatDistanceKm(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
