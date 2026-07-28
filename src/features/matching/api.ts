import { createClient } from "@/lib/supabase/client";

/** Driver ids the passenger has completed at least one trip with — feeds the "known driver" matching factor. */
export async function fetchKnownDriverIds(passengerId: string): Promise<Set<string>> {
  const supabase = createClient();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("trip_id")
    .eq("passenger_id", passengerId)
    .eq("status", "completed");
  if (bookingsError) throw bookingsError;
  if (bookings.length === 0) return new Set();

  const tripIds = [...new Set(bookings.map((booking) => booking.trip_id))];
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("driver_id")
    .in("id", tripIds);
  if (tripsError) throw tripsError;

  return new Set(trips.map((trip) => trip.driver_id));
}
