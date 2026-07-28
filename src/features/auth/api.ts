import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { uploadAvatar } from "@/lib/upload-avatar";

import type { OAuthProvider, SignInInput, SignUpInput } from "./types";

export async function fetchUniversities(): Promise<Tables<"universities">[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Signs up with email/password, then fills in the profile fields the DB trigger
 * (`handle_new_user`, see supabase/migrations/0008_rls_policies.sql) can't know about:
 * university, degree, phone, and — if provided — the avatar photo.
 */
export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { first_name: input.firstName, last_name: input.lastName },
    },
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId) return; // email confirmation required before a session/user exists

  let avatarUrl: string | null = null;
  if (input.avatarFile) {
    avatarUrl = await uploadAvatar(userId, input.avatarFile);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      university_id: input.universityId,
      university_email: input.universityEmail,
      degree: input.degree,
      phone: input.phone,
      avatar_url: avatarUrl,
    })
    .eq("id", userId);
  if (updateError) throw updateError;
}

export async function signInWithEmail(input: SignInInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) throw error;
}

export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
