import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

/**
 * Live "picked up" updates for a trip's passenger roster — lets the passenger's own
 * screen flip to "Recogido" the instant the driver taps the button, without polling.
 * Requires `passengers` in the `supabase_realtime` publication, see
 * supabase/migrations/0010_realtime_and_chat_storage.sql.
 */
export function useRealtimePassengerRoster(tripId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`passengers:${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "passengers", filter: `trip_id=eq.${tripId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["passengers", "byTrip", tripId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);
}
