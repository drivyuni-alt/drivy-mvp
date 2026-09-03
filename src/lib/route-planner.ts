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

/** Por encima de esto el número de permutaciones deja de ser trivial (8! = 40.320). */
const MAX_STOPS_FOR_EXACT_SEARCH = 8;

/** Longitud total de start → stops (en ese orden) → end. */
function routeLengthKm(start: LatLng, end: LatLng, stops: PickupStop[]): number {
  let total = 0;
  let current = start;
  for (const stop of stops) {
    total += haversineDistanceKm(current, stop.location);
    current = stop.location;
  }
  return total + haversineDistanceKm(current, end);
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const result: T[][] = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const tail of permutations(rest)) result.push([item, ...tail]);
  });
  return result;
}

/** Vecino más cercano: sólo se usa como respaldo si algún día hay demasiadas paradas. */
function nearestNeighbourOrder(start: LatLng, stops: PickupStop[]): PickupStop[] {
  const remaining = [...stops];
  const ordered: PickupStop[] = [];
  let current = start;

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
    ordered.push(next);
    current = next.location;
  }

  return ordered;
}

/**
 * Ordena las paradas de recogida minimizando la distancia TOTAL del recorrido completo,
 * origen → paradas → destino.
 *
 * Antes esto era vecino-más-cercano, y tenía un fallo de fondo que se vio en la primera
 * prueba real: al elegir siempre la parada más próxima *a la posición actual*, ignora
 * hacia dónde vas. En un trayecto a la universidad eso produce rutas absurdas — recoges
 * primero al que tienes al lado, luego tienes que salir otra vez hacia afuera a por el que
 * está lejos, y deshacer todo el camino. Lo correcto suele ser ir primero a por el más
 * alejado del destino e ir recogiendo al resto de vuelta.
 *
 * Con los 1-7 pasajeros que caben en un coche (el formulario de publicar limita a 7
 * plazas), probar todas las permutaciones es exacto y cuesta milisegundos: 7! = 5.040
 * órdenes posibles. Por encima de 8 paradas se cae a vecino-más-cercano, que es
 * aproximado pero no bloquea nada.
 *
 * Limitación que se mantiene: la distancia es en línea recta (Haversine), no por
 * carretera. Para las distancias urbanas de un trayecto a la uni el orden óptimo coincide
 * casi siempre con el real; afinarlo del todo exigiría la Directions API con
 * `optimizeWaypoints`, que no se puede llamar desde el servidor porque la clave está
 * restringida por dominio.
 */
export function planPickupRoute(
  start: LatLng,
  end: LatLng,
  stops: PickupStop[],
  startTime: Date
): RoutePlan {
  let bestOrder: PickupStop[];

  if (stops.length <= 1) {
    bestOrder = [...stops];
  } else if (stops.length <= MAX_STOPS_FOR_EXACT_SEARCH) {
    let bestLengthKm = Infinity;
    bestOrder = stops;
    for (const candidate of permutations(stops)) {
      const lengthKm = routeLengthKm(start, end, candidate);
      if (lengthKm < bestLengthKm) {
        bestLengthKm = lengthKm;
        bestOrder = candidate;
      }
    }
  } else {
    bestOrder = nearestNeighbourOrder(start, stops);
  }

  const ordered: PlannedStop[] = [];
  let current = start;
  let cumulativeDistanceKm = 0;
  let cumulativeMinutes = 0;

  for (const stop of bestOrder) {
    const legKm = haversineDistanceKm(current, stop.location);
    cumulativeDistanceKm += legKm;
    cumulativeMinutes += estimateDurationMinutes(legKm);

    ordered.push({
      ...stop,
      order: ordered.length + 1,
      distanceFromPreviousKm: legKm,
      etaMinutesFromStart: cumulativeMinutes,
      etaTimestamp: new Date(startTime.getTime() + cumulativeMinutes * 60_000).toISOString(),
    });

    current = stop.location;
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
