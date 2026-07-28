import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export async function fetchMyRatingForBooking(
  bookingId: string,
  raterId: string
): Promise<Tables<"ratings"> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("rater_id", raterId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
