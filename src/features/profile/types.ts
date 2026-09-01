import type { Tables } from "@/lib/supabase/types";

export interface ProfileDetails {
  profile: Tables<"users">;
  university: Tables<"universities"> | null;
  stats: Tables<"user_statistics"> | null;
  vehicles: Tables<"vehicles">[];
}

export interface UpdateProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  /**
   * Editables desde el perfil porque hasta 0019 el alta los perdía, y sin ellos la
   * verificación de universidad es inalcanzable: `requestUniversityVerification` compara
   * el dominio de `university_email` con el de la universidad elegida, así que si no hay
   * forma de rellenar ninguno de los dos, el usuario queda bloqueado para siempre.
   */
  universityId: string | null;
  universityEmail: string;
  degree: string;
  phone: string;
  bio: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  autoAcceptBookings: boolean;
  avatarFile?: File | null;
}
