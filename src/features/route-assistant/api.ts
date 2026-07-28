import { createClient } from "@/lib/supabase/client";

import type { PassengerWithProfile } from "./types";

export async function fetchPassengerRoster(tripId: string): Promise<PassengerWithProfile[]> {
  const supabase = createClient();

  const { data: passengers, error: passengersError } = await supabase
    .from("passengers")
    .select("*")
    .eq("trip_id", tripId)
    .order("pickup_order", { ascending: true, nullsFirst: false });
  if (passengersError) throw passengersError;
  if (passengers.length === 0) return [];

  const bookingIds = passengers.map((passenger) => passenger.booking_id);
  const userIds = passengers.map((passenger) => passenger.user_id);

  const [{ data: bookings, error: bookingsError }, { data: users, error: usersError }] =
    await Promise.all([
      supabase.from("bookings").select("*").in("id", bookingIds),
      supabase.from("users").select("*").in("id", userIds),
    ]);
  if (bookingsError) throw bookingsError;
  if (usersError) throw usersError;

  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const userById = new Map(users.map((user) => [user.id, user]));

  return passengers.flatMap((passenger) => {
    const booking = bookingById.get(passenger.booking_id);
    const user = userById.get(passenger.user_id);
    if (!booking || !user) return [];
    return [{ passenger, booking, user }];
  });
}

/** The current user's own passenger row for a trip, if they're riding as a passenger. */
export async function fetchMyPassengerStatus(
  tripId: string,
  userId: string
): Promise<PassengerWithProfile | null> {
  const roster = await fetchPassengerRoster(tripId);
  return roster.find((item) => item.user.id === userId) ?? null;
}
