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
 * Signs up with email/password. **Todo el perfil viaja en los metadatos del signUp**, no en
 * un UPDATE posterior: con la confirmación de correo activada, `signUp` devuelve `user`
 * pero no `session`, así que un UPDATE desde el navegador iría como `anon`, RLS lo
 * filtraría y afectaría a cero filas — algo que PostgREST no reporta como error. Ese fallo
 * silencioso dejaba a todos los registrados sin universidad, carrera, correo universitario
 * ni teléfono. Ahora los escribe el trigger `handle_new_user`
 * (supabase/migrations/0019_signup_profile_from_metadata.sql), que es `security definer` y
 * no necesita sesión.
 *
 * La foto de perfil es la excepción: subirla a Storage sí exige una sesión, que aquí puede
 * no existir todavía. Si no la hay se omite en vez de reventar el alta — el propio
 * formulario ya avisa de que es opcional y se puede añadir después desde el perfil.
 */
export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        university_id: input.universityId,
        university_email: input.universityEmail,
        degree: input.degree,
        phone: input.phone,
      },
    },
  });
  if (error) throw error;

  const userId = data.user?.id;
  if (!userId || !data.session || !input.avatarFile) return;

  const avatarUrl = await uploadAvatar(userId, input.avatarFile);
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
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
