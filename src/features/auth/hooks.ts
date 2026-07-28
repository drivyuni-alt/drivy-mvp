import { useMutation, useQuery } from "@tanstack/react-query";

import {
  fetchUniversities,
  signInWithEmail,
  signInWithOAuth,
  signOut,
  signUpWithEmail,
} from "./api";

export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: fetchUniversities,
    staleTime: 5 * 60_000,
  });
}

export function useSignUp() {
  return useMutation({ mutationFn: signUpWithEmail });
}

export function useSignIn() {
  return useMutation({ mutationFn: signInWithEmail });
}

export function useSignInWithOAuth() {
  return useMutation({ mutationFn: signInWithOAuth });
}

export function useSignOut() {
  return useMutation({ mutationFn: signOut });
}
