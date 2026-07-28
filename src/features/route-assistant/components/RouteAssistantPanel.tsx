"use client";

import { Badge, Button, Card } from "@/components/ui";
import { buildGoogleMapsDeepLink } from "@/lib/route-planner";
import { formatDurationMinutes } from "@/lib/geo";
import type { Tables } from "@/lib/supabase/types";

import { useCompleteTrip, useMarkPassengerPickedUp, usePassengerRoster, useStartRoute } from "../hooks";
import { useRealtimePassengerRoster } from "../realtime";

const START_ROUTE_HINT_MINUTES = 15;

export function RouteAssistantPanel({ trip }: { trip: Tables<"trips"> }) {
  const roster = usePassengerRoster(trip.id);
  const startRoute = useStartRoute();
  const markPickedUp = useMarkPassengerPickedUp(trip.id);
  const completeTrip = useCompleteTrip();
  useRealtimePassengerRoster(trip.id);

  if (roster.isLoading) return null;

  const orderedRoster = [...(roster.data ?? [])].sort(
    (a, b) => (a.passenger.pickup_order ?? 99) - (b.passenger.pickup_order ?? 99)
  );

  if (trip.status === "scheduled") {
    const minutesUntilDeparture = Math.round(
      (new Date(trip.departure_at).getTime() - Date.now()) / 60_000
    );
    const acceptedCount = roster.data?.length ?? 0;

    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Ruta inteligente</h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {acceptedCount === 0
            ? "Todavía no tienes pasajeros confirmados."
            : `${acceptedCount} pasajero${acceptedCount === 1 ? "" : "s"} confirmado${acceptedCount === 1 ? "" : "s"}. Calculamos el orden de recogida óptimo y lo abrimos en Google Maps.`}
        </p>
        {minutesUntilDeparture > START_ROUTE_HINT_MINUTES && (
          <p className="mt-1 text-xs text-neutral-400">
            Recomendamos iniciar la ruta unos {START_ROUTE_HINT_MINUTES} min antes de la salida.
          </p>
        )}

        {startRoute.data && !startRoute.data.success && (
          <p className="mt-2 text-sm text-danger">{startRoute.data.error}</p>
        )}

        <Button
          className="mt-3"
          disabled={acceptedCount === 0}
          isLoading={startRoute.isPending}
          onClick={() => startRoute.mutate(trip.id)}
        >
          Iniciar ruta
        </Button>
      </Card>
    );
  }

  if (trip.status === "completed") {
    return (
      <Card className="p-4">
        <Badge variant="success">Viaje finalizado</Badge>
      </Card>
    );
  }

  if (trip.status !== "in_progress") return null;

  const mapsUrl = buildGoogleMapsDeepLink(
    { lat: trip.origin_lat, lng: trip.origin_lng },
    { lat: trip.destination_lat, lng: trip.destination_lng },
    orderedRoster.map((item) => ({ lat: item.booking.pickup_lat, lng: item.booking.pickup_lng }))
  );
  const allPickedUp = orderedRoster.every(
    (item) => item.passenger.status === "picked_up" || item.passenger.status === "dropped_off"
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Ruta en curso</h3>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline">
            Abrir en Google Maps
          </Button>
        </a>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {orderedRoster.map((item) => (
          <PassengerStopRow
            key={item.passenger.id}
            item={item}
            onMarkPickedUp={() => markPickedUp.mutate(item.passenger.id)}
            isMarking={markPickedUp.isPending && markPickedUp.variables === item.passenger.id}
          />
        ))}
      </div>

      {completeTrip.data && !completeTrip.data.success && (
        <p className="mt-2 text-sm text-danger">{completeTrip.data.error}</p>
      )}

      <Button
        className="mt-3 w-full"
        variant={allPickedUp ? "primary" : "outline"}
        isLoading={completeTrip.isPending}
        onClick={() => completeTrip.mutate(trip.id)}
      >
        Finalizar viaje
      </Button>
    </Card>
  );
}

function PassengerStopRow({
  item,
  onMarkPickedUp,
  isMarking,
}: {
  item: {
    passenger: Tables<"passengers">;
    booking: Tables<"bookings">;
    user: Tables<"users">;
  };
  onMarkPickedUp: () => void;
  isMarking: boolean;
}) {
  const isPickedUp = item.passenger.status === "picked_up" || item.passenger.status === "dropped_off";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-ink-900 dark:bg-neutral-700 dark:text-white">
          {item.passenger.pickup_order ?? "–"}
        </span>
        <div>
          <p className="text-sm font-medium text-ink-900 dark:text-white">
            {item.user.first_name} {item.user.last_name}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {item.booking.pickup_address}
            {item.passenger.eta_seconds != null &&
              ` · ETA ${formatDurationMinutes(Math.round(item.passenger.eta_seconds / 60))}`}
          </p>
        </div>
      </div>

      {isPickedUp ? (
        <Badge variant="success">Recogido</Badge>
      ) : (
        <Button size="sm" isLoading={isMarking} onClick={onMarkPickedUp}>
          Recogido
        </Button>
      )}
    </div>
  );
}
