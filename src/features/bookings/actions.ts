"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

import type { ActionResult, BookingDecision, CreateBookingInput } from "./types";

/**
 * Everything that must happen when a booking becomes `accepted` — whether that's the
 * driver clicking "Aceptar" or the trip's `auto_accept_bookings` firing immediately.
 * Runs on the service-role client because it writes to `passengers`, `chats`,
 * `notifications` and `trips.available_seats`, none of which grant an `authenticated`
 * write policy (see supabase/migrations/0008_rls_policies.sql and
 * docs/02-decisiones-fase-1.md — this function is that assumption's resolution).
 */
async function applyBookingAcceptance(
  admin: ReturnType<typeof createAdminClient>,
  booking: Tables<"bookings">,
  trip: Tables<"trips">
): Promise<void> {
  const respondedAt = new Date().toISOString();

  const { error: bookingError } = await admin
    .from("bookings")
    .update({ status: "accepted", responded_at: respondedAt })
    .eq("id", booking.id);
  if (bookingError) throw bookingError;

  const { error: seatsError } = await admin
    .from("trips")
    .update({ available_seats: Math.max(0, trip.available_seats - booking.seats_requested) })
    .eq("id", trip.id);
  if (seatsError) throw seatsError;

  const { error: passengerError } = await admin.from("passengers").insert({
    trip_id: trip.id,
    booking_id: booking.id,
    user_id: booking.passenger_id,
  });
  if (passengerError) throw passengerError;

  const { error: chatError } = await admin.from("chats").insert({
    trip_id: trip.id,
    booking_id: booking.id,
    driver_id: trip.driver_id,
    passenger_id: booking.passenger_id,
  });
  if (chatError) throw chatError;

  const { error: notificationError } = await admin.from("notifications").insert({
    user_id: booking.passenger_id,
    type: "booking_accepted",
    title: "Reserva confirmada",
    body: "Tu reserva ha sido aceptada. Ya puedes chatear con el conductor.",
    data: { trip_id: trip.id, booking_id: booking.id },
  });
  if (notificationError) throw notificationError;
}

export async function createBookingAction(input: CreateBookingInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== input.passengerId) {
    return { success: false, error: "Debes iniciar sesión para reservar." };
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", input.tripId)
    .single();
  if (tripError || !trip) {
    return { success: false, error: "Viaje no encontrado." };
  }
  if (trip.available_seats < input.seatsRequested) {
    return { success: false, error: "No quedan plazas suficientes en este viaje." };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      trip_id: input.tripId,
      passenger_id: input.passengerId,
      seats_requested: input.seatsRequested,
      pickup_address: input.pickupAddress,
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      dropoff_address: input.dropoffAddress,
      dropoff_lat: input.dropoffLat,
      dropoff_lng: input.dropoffLng,
      price_total: input.priceTotal,
      match_score: input.matchScore,
    })
    .select("*")
    .single();
  if (bookingError || !booking) {
    return { success: false, error: bookingError?.message ?? "No se pudo crear la reserva." };
  }

  const admin = createAdminClient();

  if (trip.auto_accept_bookings) {
    await applyBookingAcceptance(admin, booking, trip);
  } else {
    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: trip.driver_id,
      type: "booking_requested",
      title: "Nueva solicitud de reserva",
      body: `Tienes una nueva solicitud de ${input.seatsRequested} plaza(s) para tu viaje.`,
      data: { trip_id: trip.id, booking_id: booking.id },
    });
    if (notificationError) throw notificationError;
  }

  revalidatePath(`/trips/${input.tripId}`);
  return { success: true };
}

export async function respondToBookingAction(
  bookingId: string,
  decision: BookingDecision
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();
  if (bookingError || !booking) {
    return { success: false, error: "Reserva no encontrada." };
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", booking.trip_id)
    .single();
  if (tripError || !trip) {
    return { success: false, error: "Viaje no encontrado." };
  }
  if (trip.driver_id !== user.id) {
    return { success: false, error: "Sólo el conductor puede responder a esta reserva." };
  }
  if (booking.status !== "pending") {
    return { success: false, error: "Esta reserva ya ha sido respondida." };
  }

  const admin = createAdminClient();

  if (decision === "accepted") {
    if (trip.available_seats < booking.seats_requested) {
      return { success: false, error: "No quedan plazas suficientes." };
    }
    await applyBookingAcceptance(admin, booking, trip);
  } else {
    const { error: updateError } = await admin
      .from("bookings")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", booking.id);
    if (updateError) throw updateError;

    const { error: notificationError } = await admin.from("notifications").insert({
      user_id: booking.passenger_id,
      type: "booking_rejected",
      title: "Reserva rechazada",
      body: "El conductor no ha podido aceptar tu solicitud para este viaje.",
      data: { trip_id: trip.id, booking_id: booking.id },
    });
    if (notificationError) throw notificationError;
  }

  revalidatePath(`/trips/${booking.trip_id}`);
  return { success: true };
}
