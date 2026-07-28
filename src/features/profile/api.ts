import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/upload-avatar";

import type { ProfileDetails, UpdateProfileInput } from "./types";

export async function fetchProfileDetails(userId: string): Promise<ProfileDetails> {
  const supabase = createClient();

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (profileError) throw profileError;

  const [
    { data: university, error: universityError },
    { data: stats, error: statsError },
    { data: vehicles, error: vehiclesError },
  ] = await Promise.all([
    profile.university_id
      ? supabase.from("universities").select("*").eq("id", profile.university_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("user_statistics").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("vehicles").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
  ]);
  if (universityError) throw universityError;
  if (statsError) throw statsError;
  if (vehiclesError) throw vehiclesError;

  return { profile, university, stats, vehicles };
}

export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  const supabase = createClient();

  let avatarUrl: string | undefined;
  if (input.avatarFile) {
    avatarUrl = await uploadAvatar(input.userId, input.avatarFile);
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      degree: input.degree,
      phone: input.phone,
      bio: input.bio,
      emergency_contact_name: input.emergencyContactName || null,
      emergency_contact_phone: input.emergencyContactPhone || null,
      auto_accept_bookings: input.autoAcceptBookings,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", input.userId);
  if (error) throw error;
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
  if (error) throw error;
}

/**
 * Simplified "verification": compares `university_email`'s domain against the user's
 * university `email_domain`. No confirmation email is actually sent — see
 * docs/07-decisiones-fase-5.md for why a real flow needs an email-sending backend this
 * MVP doesn't have.
 */
export async function verifyUniversityEmail(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  if (!profile.university_id || !profile.university_email) return false;

  const { data: university, error: universityError } = await supabase
    .from("universities")
    .select("*")
    .eq("id", profile.university_id)
    .single();
  if (universityError) throw universityError;

  const domain = profile.university_email.split("@")[1]?.toLowerCase();
  const matches = domain === university.email_domain.toLowerCase();
  if (!matches) return false;

  const { error: updateError } = await supabase
    .from("users")
    .update({ is_university_verified: true })
    .eq("id", userId);
  if (updateError) throw updateError;

  return true;
}

