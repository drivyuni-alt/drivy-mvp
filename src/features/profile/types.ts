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
  degree: string;
  phone: string;
  bio: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  autoAcceptBookings: boolean;
  avatarFile?: File | null;
}
