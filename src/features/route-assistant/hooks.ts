import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchPassengerRoster } from "./api";
import { completeTripAction, markPassengerPickedUpAction, startRouteAction } from "./actions";

export function usePassengerRoster(tripId: string) {
  return useQuery({
    queryKey: ["passengers", "byTrip", tripId],
    queryFn: () => fetchPassengerRoster(tripId),
  });
}

export function useStartRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startRouteAction,
    onSuccess: (_result, tripId) => {
      queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["passengers", "byTrip", tripId] });
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
