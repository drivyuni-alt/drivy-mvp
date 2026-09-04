"use client";

import { RouteMap } from "@/components/maps/RouteMap";
import { Button } from "@/components/ui";
import {
  useDriverLocation,
  usePublishDriverLocation,
} from "@/features/route-assistant/driver-location";
import { formatTime } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";

/**
 * Mapa del viaje con la posición del conductor en vivo, al estilo de Uber: mientras la
 * ruta está en curso el conductor la publica automáticamente y los pasajeros la ven, que
 * es lo que les permite decidir cuándo bajar de casa.
 *
 * Se activa solo con el viaje `in_progress` y se apaga al terminar, así que nadie comparte
 * su ubicación fuera del trayecto ni gasta batería de más. El conductor no tiene que
 * acordarse de pulsar nada: si tuviera que hacerlo, el pasajero se quedaría sin ver el
 * coche justo los días en que se le olvida.
 */
export function TripMapWithDriver({
  trip,
  isDriver,
  currentUserId,
}: {
  trip: Tables<"trips">;
  isDriver: boolean;
  currentUserId: string;
}) {
  const routeInProgress = trip.status === "in_progress";

  const publish = usePublishDriverLocation({
    tripId: trip.id,
    driverId: currentUserId,
    enabled: routeInProgress && isDriver,
  });

  const driverLocation = useDriverLocation({
    tripId: trip.id,
    enabled: routeInProgress && !isDriver,
  });

  return (
    <div className="flex flex-col gap-2">
      <RouteMap
        origin={{ lat: trip.origin_lat, lng: trip.origin_lng }}
        destination={{ lat: trip.destination_lat, lng: trip.destination_lng }}
        driverLocation={driverLocation}
        className="h-56 w-full overflow-hidden rounded-2xl"
      />

      {routeInProgress && isDriver && (
        <div className="flex flex-col gap-2">
          {publish.error && <p className="text-xs text-danger">{publish.error}</p>}

          {publish.isSharing ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              📍 Compartiendo tu ubicación con los pasajeros del viaje.
            </p>
          ) : (
            <Button size="sm" variant="outline" onClick={publish.start}>
              Compartir mi ubicación con los pasajeros
            </Button>
          )}
        </div>
      )}

      {routeInProgress && !isDriver && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {driverLocation
            ? `Ubicación del conductor · actualizada a las ${formatTime(driverLocation.updatedAt)}`
            : "Esperando la ubicación del conductor…"}
        </p>
      )}
    </div>
  );
}
