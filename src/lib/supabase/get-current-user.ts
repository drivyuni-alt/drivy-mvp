import "server-only";
import { cache } from "react";

import { createClient } from "./server";
import type { Tables } from "./types";

export interface CurrentUser {
  authUserId: string;
  profile: Tables<"users">;
}

/**
 * Server-only helper for Server Components / Server Actions: session + app profile.
 * Wrapped in React's `cache()` so the layout and the page can both call it within the
 * same request without doubling the Supabase round-trip.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return { authUserId: user.id, profile };
});
