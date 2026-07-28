"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Card } from "@/components/ui";
import { formatTime } from "@/lib/format";

import { useLiveLocationChannel } from "../live-location";

export function LiveLocationShare({ tripId, currentUserId }: { tripId: string; currentUserId: string }) {
  const { locations, broadcastLocation } = useLiveLocationChannel(tripId);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function toggleSharing() {
    if (sharing) {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setSharing(false);
      return;
    }
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition((position) => {
      broadcastLocation(currentUserId, position.coords.latitude, position.coords.longitude);
    });
    setSharing(true);
  }

  const others = Object.values(locations).filter((location) => location.userId !== currentUserId);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
            Compartir trayecto en vivo
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Los demás participantes verán tu posición mientras dure el viaje.
          </p>
        </div>
        <Button size="sm" variant={sharing ? "primary" : "outline"} onClick={toggleSharing}>
          {sharing ? "Dejar de compartir" : "Compartir"}
        </Button>
      </div>

      {others.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          {others.map((location) => (
            <a
              key={location.userId}
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 underline dark:text-brand"
            >
              Ver ubicación compartida ({formatTime(location.at)})
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
