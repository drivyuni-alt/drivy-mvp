import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Tables } from "@/lib/supabase/types";

import {
  createTrip,
  fetchTripById,
  fetchTripHistoryForUser,
  fetchUpcomingTripsForUser,
  fetchVehiclesForUser,
  searchTrips,
} from "./api";
import type { TripSearchParams } from "./types";

export function useSearchTrips(params: TripSearchParams, enabled = true) {
  return useQuery({
    queryKey: ["trips", "search", params],
    queryFn: () => searchTrips(params),
    enabled,
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: () => fetchTripById(id),
  });
}

export function useVehiclesForUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["vehicles", "byOwner", userId],
    queryFn: () => fetchVehiclesForUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpcomingTrips(userId: string | undefined) {
  return useQuery({
    queryKey: ["trips", "upcoming", userId],
    queryFn: () => fetchUpcomingTripsForUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useTripHistory(userId: string | undefined, statuses: Tables<"trips">["status"][]) {
  return useQuery({
    queryKey: ["trips", "history", userId, statuses],
    queryFn: () => fetchTripHistoryForUser(userId!, statuses),
    enabled: Boolean(userId),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
