import { planPickupRoute } from "@/lib/route-planner";
import type { LatLng } from "@/lib/geo";

import type { PassengerWithProfile, RealRouteTimings } from "./types";

/**
 * El límite de Google para paradas intermedias en `DirectionsService` es de 25. El
 * formulario de publicar viaje topa las plazas en 7, así que nunca nos acercamos — pero si
 * algún día se sube ese tope (una furgoneta, un autobús de campus), esto es lo que hay que
 * mirar antes: por encima de 25 la petición se rechaza entera y caeríamos siempre al
 * respaldo sin enterarnos.
 */
const MAX_WAYPOINTS = 25;

/**
 * Tiempos de trayecto reales para la ruta de recogidas, pedidos a Google desde el navegador.
 *
 * Por qué desde el navegador y no desde el servidor, que sería lo natural: la clave de Maps
 * está restringida por dominio, así que una llamada desde el servidor devuelve REQUEST_DENIED
 * (es la misma razón por la que el orden de las paradas se calcula con Haversine en vez de
 * con `optimizeWaypoints`). El conductor ya tiene el SDK cargado en su pantalla, así que se
 * le piden los tiempos ahí y se mandan al servidor con la acción. Sin segunda clave y sin
 * proxy.
 *
 * Lo que se sustituye es sólo el TIEMPO. El orden de recogida lo sigue decidiendo
 * `planPickupRoute` por fuerza bruta, y por eso la petición va con `optimizeWaypoints: false`:
 * a Google se le pregunta cuánto se tarda en hacer este recorrido, no cómo ordenarlo.
 *
 * Devuelve `null` en cuanto algo no encaja —sin red, cuota agotada, sin clave, una parada sin
 * ruta por carretera—, y quien llama se queda con la estimación del servidor. Iniciar la ruta
 * nunca puede depender de que Google conteste.
 */
export async function fetchRealRouteTimings(
  origin: LatLng,
  destination: LatLng,
  roster: PassengerWithProfile[]
): Promise<RealRouteTimings | null> {
  if (roster.length === 0 || roster.length > MAX_WAYPOINTS) return null;
  if (typeof window === "undefined" || !window.google?.maps?.DirectionsService) return null;

  // El mismo orden que calculará el servidor: `planPickupRoute` es una función pura sobre las
  // coordenadas, así que con las mismas entradas da el mismo resultado en los dos lados.
  const plan = planPickupRoute(
    origin,
    destination,
    roster.map((item) => ({
      passengerId: item.passenger.user_id,
      label: item.user.first_name,
      location: { lat: item.booking.pickup_lat, lng: item.booking.pickup_lng },
    })),
    new Date()
  );

  const waypoints = plan.stops.map((stop) => ({ location: stop.location, stopover: true }));

  // Primero con tráfico del momento, que es justo lo que el conductor tiene delante al salir.
  // Si esa petición se cae —hay cuentas y configuraciones donde `drivingOptions` no está
  // disponible—, se reintenta sin él antes de rendirse: unos tiempos reales sin tráfico siguen
  // siendo mucho mejores que una regla de tres a 35 km/h.
  const route =
    (await requestRoute(origin, destination, waypoints, true)) ??
    (await requestRoute(origin, destination, waypoints, false));
  if (!route) return null;

  const legs = route.legs ?? [];
  // Un tramo por parada más el último hasta el destino. Si no cuadra, algo se ha entendido
  // mal y es preferible el respaldo a repartir tiempos que no corresponden.
  if (legs.length !== plan.stops.length + 1) return null;

  const etaSecondsByPassengerId: Record<string, number> = {};
  let cumulativeSeconds = 0;
  let withTraffic = true;

  for (const [index, stop] of plan.stops.entries()) {
    const leg = legs[index]!;
    const inTraffic = leg.duration_in_traffic?.value;
    const plain = leg.duration?.value;
    if (inTraffic == null) withTraffic = false;

    const seconds = inTraffic ?? plain;
    if (seconds == null) return null;

    cumulativeSeconds += seconds;
    etaSecondsByPassengerId[stop.passengerId] = cumulativeSeconds;
  }

  const lastLeg = legs[legs.length - 1]!;
  const lastSeconds = lastLeg.duration_in_traffic?.value ?? lastLeg.duration?.value;
  if (lastSeconds == null) return null;

  return {
    etaSecondsByPassengerId,
    totalDurationSeconds: cumulativeSeconds + lastSeconds,
    withTraffic,
  };
}

async function requestRoute(
  origin: LatLng,
  destination: LatLng,
  waypoints: google.maps.DirectionsWaypoint[],
  withTraffic: boolean
): Promise<google.maps.DirectionsRoute | null> {
  try {
    const service = new google.maps.DirectionsService();
    const response = await service.route({
      origin,
      destination,
      waypoints,
      optimizeWaypoints: false, // el orden ya está decidido, aquí sólo se mide el tiempo
      travelMode: google.maps.TravelMode.DRIVING,
      ...(withTraffic
        ? {
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            },
          }
        : {}),
    });
    return response.routes[0] ?? null;
  } catch {
    return null;
  }
}
