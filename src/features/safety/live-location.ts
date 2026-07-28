import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export interface SharedLocation {
  userId: string;
  lat: number;
  lng: number;
  at: string;
}

/**
 * "Compartir trayecto en tiempo real" over a Realtime Broadcast channel scoped to the
 * trip — positions are never persisted to Postgres, only relayed live to whoever else
 * has the trip page open. See docs/07-decisiones-fase-5.md for why this is an
 * in-app-only share (not a public external link).
 */
export function useLiveLocationChannel(tripId: string) {
  const [locations, setLocations] = useState<Record<string, SharedLocation>>({});
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`location:${tripId}`)
      .on("broadcast", { event: "location" }, ({ payload }) => {
        const location = payload as SharedLocation;
        setLocations((prev) => ({ ...prev, [location.userId]: location }));
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  function broadcastLocation(userId: string, lat: number, lng: number) {
    channelRef.current?.send({
      type: "broadcast",
      event: "location",
      payload: { userId, lat, lng, at: new Date().toISOString() } satisfies SharedLocation,
    });
  }

  return { locations, broadcastLocation };
}
