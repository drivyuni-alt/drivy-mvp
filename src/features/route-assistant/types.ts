import type { Tables } from "@/lib/supabase/types";

export interface PassengerWithProfile {
  passenger: Tables<"passengers">;
  booking: Tables<"bookings">;
  user: Tables<"users">;
}
