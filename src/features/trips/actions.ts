"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/action-result";

/**
 * Cancela un viaje publicado. Hasta ahora no había forma de hacerlo: el enum de estados y
 * la pestaña "Cancelados" del historial existían desde la Fase 1, pero nada llevaba un
 * viaje a ese estado, así que un conductor que publicaba por error —o al que le surgía
 * algo— dejaba a sus pasajeros esperando un coche que no iba a aparecer.
 *
 * Va por Server Action con service role, y no desde el cliente, por el mismo motivo que
 * `respondToBookingAction`: RLS deja al conductor tocar SU viaje, pero no cancelar las
 * reservas de otros ni escribir en `notifications`. Avisar a los pasajeros es justo la
 * parte que no se puede delegar al navegador.
 */
export async function cancelTripAction(tripId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();
  if (tripError || !trip) {
    return { success: false, error: "Viaje no encontrado." };
  }
  if (trip.driver_id !== user.id) {
    return { success: false, error: "Solo el conductor puede cancelar este viaje." };
  }
  if (trip.status === "cancelled") {
    return { success: false, error: "Este viaje ya está cancelado." };
  }
  if (trip.status === "completed") {
    return { success: false, error: "No se puede cancelar un viaje que ya ha terminado." };
  }

  const admin = createAdminClient();

  const { error: statusError } = await admin
    .from("trips")
    .update({ status: "cancelled" })
    .eq("id", tripId);
  if (statusError) {
    return { success: false, error: "No se pudo cancelar el viaje." };
  }

  // Las reservas vivas se cancelan también: dejarlas en pie mostraría a los pasajeros una
  // reserva "aceptada" sobre un viaje que ya no existe.
  const { data: affected, error: bookingsError } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("trip_id", tripId)
    .in("status", ["pending", "accepted"])
    .select("passenger_id");
  if (bookingsError) {
    return { success: false, error: "El viaje se canceló pero no se pudieron cancelar las reservas." };
  }

  const passengerIds = [...new Set((affected ?? []).map((booking) => booking.passenger_id))];
  if (passengerIds.length > 0) {
    const { error: notificationError } = await admin.from("notifications").insert(
      passengerIds.map((passengerId) => ({
        user_id: passengerId,
        type: "booking_cancelled" as const,
        title: "Viaje cancelado",
        body: `El conductor ha cancelado el viaje de ${trip.origin_address} a ${trip.destination_address}.`,
        data: { trip_id: tripId },
      }))
    );
    if (notificationError) {
      return {
        success: false,
        error: "El viaje se canceló pero no se pudo avisar a los pasajeros.",
      };
    }
  }

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips/history");
  return { success: true };
}
