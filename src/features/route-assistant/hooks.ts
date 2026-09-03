import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchPassengerRoster } from "./api";
import { completeTripAction, markPassengerPickedUpAction, startRouteAction } from "./actions";

export function usePassengerRoster(tripId: string) {
  return useQuery({
    queryKey: ["passengers", "byTrip", tripId],
    queryFn: () => fetchPassengerRoster(tripId),
    // Mantener los datos anteriores durante cualquier recarga. Sin esto, una invalidación
    // (la de "Iniciar ruta", o cualquiera de las que dispara Realtime al marcar recogidas)
    // puede dejar la lista sin datos un instante y hacer desaparecer el panel.
    placeholderData: (previous) => previous,
  });
}

export function useStartRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startRouteAction,
    /**
     * Se espera a que AMBAS consultas terminen antes de dar la mutación por hecha. Si no,
     * el viaje pasa a "en curso" mientras el roster todavía es el anterior: la vista salta
     * a la lista de recogidas con `pickup_order` a null, muestra guiones y un orden que no
     * es el bueno, y se recoloca sola un instante después. Eso es el parpadeo.
     */
    onSuccess: async (_result, tripId) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["passengers", "byTrip", tripId] }),
        queryClient.refetchQueries({ queryKey: ["trips", tripId] }),
      ]);
    },
  });
}

export function useMarkPassengerPickedUp(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markPassengerPickedUpAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers", "byTrip", tripId] });
    },
  });
}

export function useCompleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeTripAction,
    onSuccess: (_result, tripId) => {
      queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["passengers", "byTrip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
