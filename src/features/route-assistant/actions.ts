"use server";

import { revalidatePath } from "next/cache";

import { unlockAchievementsForUser } from "@/features/gamification/unlock-achievements";
import { haversineDistanceKm } from "@/lib/geo";
import { estimateCo2SavedKg, estimateMoneySavedEur } from "@/lib/impact";
import { planPickupRoute } from "@/lib/route-planner";
import type { PickupStop } from "@/lib/route-planner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RouteWaypoint, Tables } from "@/lib/supabase/types";
import type { ActionResult } from "@/types/action-result";

/**
 * Driver taps "Iniciar ruta": computes the pickup order + ETAs (see
 * src/lib/route-planner.ts), moves the trip to `in_progress`, persists the plan to
 * `routes.waypoints`, and notifies every accepted passenger. All in one Server Action
 * because most of these writes touch tables passengers/notifications don't have an
 * `authenticated` write policy for — see docs/06-decisiones-fase-4.md.
 */
export async function startRouteAction(tripId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Debes iniciar sesión." };

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();
  if (tripError || !trip) return { success: false, error: "Viaje no encontrado." };
  if (trip.driver_id !== user.id) {
    return { success: false, error: "Sólo el conductor puede iniciar la ruta." };
  }
  if (trip.status !== "scheduled") {
    return { success: false, error: "Esta ruta ya se inició o ha finalizado." };
  }

  const { data: passengerRows, error: passengersError } = await supabase
    .from("passengers")
    .select("*")
    .eq("trip_id", tripId);
  if (passengersError) throw passengersError;

  if (passengerRows.length === 0) {
    return { success: false, error: "Todavía no tienes pasajeros confirmados en este viaje." };
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .in(
      "id",
      passengerRows.map((row) => row.booking_id)
    );
  if (bookingsError) throw bookingsError;
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));

  const stops: PickupStop[] = passengerRows.map((row) => {
    const booking = bookingById.get(row.booking_id);
    return {
      passengerId: row.user_id,
      label: row.user_id,
      location: {
        lat: booking?.pickup_lat ?? trip.origin_lat,
        lng: booking?.pickup_lng ?? trip.origin_lng,
      },
    };
  });

  const plan = planPickupRoute(
    { lat: trip.origin_lat, lng: trip.origin_lng },
    { lat: trip.destination_lat, lng: trip.destination_lng },
    stops,
    new Date()
  );

  const waypoints: RouteWaypoint[] = plan.stops.map((stop) => {
    const passengerRow = passengerRows.find((row) => row.user_id === stop.passengerId);
    const booking = passengerRow ? bookingById.get(passengerRow.booking_id) : undefined;
    return {
      passenger_id: stop.passengerId,
      lat: stop.location.lat,
      lng: stop.location.lng,
      address: booking?.pickup_address ?? "",
      eta_seconds: stop.etaMinutesFromStart * 60,
      order: stop.order,
    };
  });

  const admin = createAdminClient();

  let routeId = trip.route_id;
  if (routeId) {
    const { error } = await admin
      .from("routes")
      .update({
        distance_meters: Math.round(plan.totalDistanceKm * 1000),
        duration_seconds: plan.totalDurationMinutes * 60,
        waypoints,
      })
      .eq("id", routeId);
    if (error) throw error;
  } else {
    const { data: newRoute, error } = await admin
      .from("routes")
      .insert({
        origin_address: trip.origin_address,
        origin_lat: trip.origin_lat,
        origin_lng: trip.origin_lng,
        destination_address: trip.destination_address,
        destination_lat: trip.destination_lat,
        destination_lng: trip.destination_lng,
        distance_meters: Math.round(plan.totalDistanceKm * 1000),
        duration_seconds: plan.totalDurationMinutes * 60,
        waypoints,
      })
      .select("id")
      .single();
    if (error) throw error;
    routeId = newRoute.id;
  }

  const { error: tripUpdateError } = await admin
    .from("trips")
    .update({ status: "in_progress", started_at: new Date().toISOString(), route_id: routeId })
    .eq("id", tripId);
  if (tripUpdateError) throw tripUpdateError;

  await Promise.all(
    plan.stops.map((stop) => {
      const passengerRow = passengerRows.find((row) => row.user_id === stop.passengerId);
      if (!passengerRow) return Promise.resolve();
      return admin
        .from("passengers")
        .update({ pickup_order: stop.order, eta_seconds: stop.etaMinutesFromStart * 60 })
        .eq("id", passengerRow.id);
    })
  );

  await Promise.all(
    plan.stops.map((stop) =>
      admin.from("notifications").insert({
        user_id: stop.passengerId,
        type: "trip_starting_soon",
        title: "Tu conductor ha iniciado la ruta",
        body: `Llegará a tu punto de recogida en aproximadamente ${stop.etaMinutesFromStart} min.`,
        data: { trip_id: tripId },
      })
    )
  );

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}

export async function markPassengerPickedUpAction(passengerRowId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Debes iniciar sesión." };

  const { data: passengerRow, error } = await supabase
    .from("passengers")
    .select("*")
    .eq("id", passengerRowId)
    .single();
  if (error || !passengerRow) return { success: false, error: "Pasajero no encontrado." };

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", passengerRow.trip_id)
    .single();
  if (tripError || !trip) return { success: false, error: "Viaje no encontrado." };
  if (trip.driver_id !== user.id) {
    return { success: false, error: "Sólo el conductor puede marcar esta recogida." };
  }

  const { error: updateError } = await supabase
    .from("passengers")
    .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
    .eq("id", passengerRowId);
  if (updateError) throw updateError;

  const admin = createAdminClient();
  const { error: notificationError } = await admin.from("notifications").insert({
    user_id: passengerRow.user_id,
    type: "passenger_picked_up",
    title: "¡Recogido!",
    body: "El conductor te ha marcado como recogido.",
    data: { trip_id: passengerRow.trip_id },
  });
  if (notificationError) throw notificationError;

  revalidatePath(`/trips/${passengerRow.trip_id}`);
  return { success: true };
}

/**
 * Driver taps "Finalizar viaje": closes out the trip/bookings/roster, credits every
 * participant's `user_statistics` (distance, money/CO2 "saved" — see
 * src/lib/impact.ts for the assumptions behind those numbers, and
 * docs/07-decisiones-fase-5.md), then re-checks achievements for everyone involved.
 */
export async function completeTripAction(tripId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Debes iniciar sesión." };

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();
  if (tripError || !trip) return { success: false, error: "Viaje no encontrado." };
  if (trip.driver_id !== user.id) {
    return { success: false, error: "Sólo el conductor puede finalizar el viaje." };
  }
  if (trip.status !== "in_progress") {
    return { success: false, error: "El viaje no está en curso." };
  }

  const { data: passengerRows, error: passengersError } = await supabase
    .from("passengers")
    .select("*")
    .eq("trip_id", tripId);
  if (passengersError) throw passengersError;

  const bookingIds = passengerRows.map((row) => row.booking_id);
  const { data: bookings, error: bookingsError } =
    bookingIds.length > 0
      ? await supabase.from("bookings").select("*").in("id", bookingIds)
      : { data: [] as Tables<"bookings">[], error: null };
  if (bookingsError) throw bookingsError;
  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));

  const admin = createAdminClient();
  const now = new Date().toISOString();

  await admin.from("trips").update({ status: "completed", completed_at: now }).eq("id", tripId);

  await Promise.all([
    ...passengerRows.map((row) =>
      admin
        .from("passengers")
        .update({ status: "dropped_off", dropped_off_at: now })
        .eq("id", row.id)
    ),
    bookingIds.length > 0
      ? admin.from("bookings").update({ status: "completed" }).in("id", bookingIds)
      : Promise.resolve(),
  ]);

  const distanceKm = haversineDistanceKm(
    { lat: trip.origin_lat, lng: trip.origin_lng },
    { lat: trip.destination_lat, lng: trip.destination_lng }
  );

  const { data: driverStats } = await admin
    .from("user_statistics")
    .select("*")
    .eq("user_id", trip.driver_id)
    .single();
  if (driverStats) {
    await admin
      .from("user_statistics")
      .update({
        trips_as_driver: driverStats.trips_as_driver + 1,
        distance_km_total: driverStats.distance_km_total + distanceKm,
        co2_saved_kg: driverStats.co2_saved_kg + estimateCo2SavedKg(distanceKm) * passengerRows.length,
        total_points: driverStats.total_points + 20,
      })
      .eq("user_id", trip.driver_id);
  }

  await Promise.all(
    passengerRows.map(async (row) => {
      const booking = bookingById.get(row.booking_id);
      const { data: stats } = await admin
        .from("user_statistics")
        .select("*")
        .eq("user_id", row.user_id)
        .single();
      if (!stats) return;

      await admin
        .from("user_statistics")
        .update({
          trips_as_passenger: stats.trips_as_passenger + 1,
          distance_km_total: stats.distance_km_total + distanceKm,
          money_saved_eur:
            stats.money_saved_eur + estimateMoneySavedEur(distanceKm, booking?.price_total ?? 0),
          co2_saved_kg: stats.co2_saved_kg + estimateCo2SavedKg(distanceKm),
          total_points: stats.total_points + 10,
        })
        .eq("user_id", row.user_id);
    })
  );

  const participantIds = [trip.driver_id, ...passengerRows.map((row) => row.user_id)];
  await Promise.all(participantIds.map((userId) => unlockAchievementsForUser(admin, userId)));

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
