"use client";

import { Badge, Card } from "@/components/ui";
import { formatDurationMinutes } from "@/lib/geo";

import { usePassengerRoster } from "../hooks";
import { useRealtimePassengerRoster } from "../realtime";

export function PassengerLiveStatus({ tripId, userId }: { tripId: string; userId: string }) {
  const roster = usePassengerRoster(tripId);
  useRealtimePassengerRoster(tripId);

  const myStop = roster.data?.find((item) => item.user.id === userId);
  if (!myStop) return null;

  const { passenger } = myStop;

  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
          Tu conductor está en ruta
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {passenger.status === "picked_up" || passenger.status === "dropped_off"
            ? "Ya te ha recogido."
            : passenger.eta_seconds != null
              ? `Llega a tu punto de recogida en ~${formatDurationMinutes(Math.round(passenger.eta_seconds / 60))}.`
              : "Calculando tu orden de recogida…"}
        </p>
      </div>
      <Badge variant={passenger.status === "waiting" ? "warning" : "success"}>
        {passenger.status === "waiting" ? "Esperando" : "Recogido"}
      </Badge>
    </Card>
  );
}
