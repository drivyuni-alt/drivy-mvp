import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMyRatingForBooking } from "./api";
import { submitRatingAction } from "./actions";

export function useMyRatingForBooking(bookingId: string, raterId: string | undefined) {
  return useQuery({
    queryKey: ["ratings", "mine", bookingId, raterId],
    queryFn: () => fetchMyRatingForBooking(bookingId, raterId!),
    enabled: Boolean(raterId),
  });
}

export function useSubmitRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitRatingAction,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ratings", "mine", variables.bookingId, variables.raterId],
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
