import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

import type { BookingWithPassenger, BookingWithTripSummary } from "./types";

export async function fetchBookingsForTrip(tripId: string): Promise<BookingWithPassenger[]> {
  const supabase = createClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("trip_id", tripId)
    .order("requested_at", { ascending: true });
  if (error) throw error;
  if (bookings.length === 0) return [];

  const passengerIds = [...new Set(bookings.map((booking) => booking.passenger_id))];
  const { data: passengers, error: passengersError } = await supabase
    .from("users")
    .select("*")
    .in("id", passengerIds);
  if (passengersError) throw passengersError;

  const passengerById = new Map(passengers.map((passenger) => [passenger.id, passenger]));
  return bookings.flatMap((booking) => {
    const passenger = passengerById.get(booking.passenger_id);
    return passenger ? [{ booking, passenger }] : [];
  });
}

/** Every booking the passenger has ever made, with its trip + driver — powers the "Reservas" history tab. */
export async function fetchMyBookingsWithTrip(passengerId: string): Promise<BookingWithTripSummary[]> {
  const supabase = createClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("passenger_id", passengerId)
    .order("requested_at", { ascending: false });
  if (error) throw error;
  if (bookings.length === 0) return [];

  const tripIds = [...new Set(bookings.map((booking) => booking.trip_id))];
  const { data: trips, error: tripsError } = await supabase.from("trips").select("*").in("id", tripIds);
  if (tripsError) throw tripsError;

  const driverIds = [...new Set(trips.map((trip) => trip.driver_id))];
  const { data: drivers, error: driversError } = await supabase
    .from("users")
    .select("*")
    .in("id", driverIds);
  if (driversError) throw driversError;

  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

  return bookings.flatMap((booking) => {
    const trip = tripById.get(booking.trip_id);
    const driver = trip && driverById.get(trip.driver_id);
    return trip && driver ? [{ booking, trip, driver }] : [];
  });
}

export async function fetchMyBookingForTrip(
  tripId: string,
  passengerId: string
): Promise<Tables<"bookings"> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("trip_id", tripId)
    .eq("passenger_id", passengerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
