import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchBookingsForTrip, fetchMyBookingForTrip, fetchMyBookingsWithTrip } from "./api";
import { createBookingAction, respondToBookingAction } from "./actions";
import type { BookingDecision } from "./types";

export function useBookingsForTrip(tripId: string) {
  return useQuery({
    queryKey: ["bookings", "byTrip", tripId],
    queryFn: () => fetchBookingsForTrip(tripId),
  });
}

export function useMyBookingForTrip(tripId: string, passengerId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", "mine", tripId, passengerId],
    queryFn: () => fetchMyBookingForTrip(tripId, passengerId!),
    enabled: Boolean(passengerId),
  });
}

export function useMyBookings(passengerId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", "mine", "all", passengerId],
    queryFn: () => fetchMyBookingsWithTrip(passengerId!),
    enabled: Boolean(passengerId),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBookingAction,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["trips", variables.tripId] });
    },
  });
}

export function useRespondToBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, decision }: { bookingId: string; decision: BookingDecision }) =>
      respondToBookingAction(bookingId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
