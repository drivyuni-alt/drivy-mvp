import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteVehicle, fetchProfileDetails, updateProfile, verifyUniversityEmail } from "./api";

export function useProfileDetails(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfileDetails(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile", variables.userId] });
    },
  });
}

export function useDeleteVehicle(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

export function useVerifyUniversityEmail(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => verifyUniversityEmail(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
