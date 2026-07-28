"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/action-result";

/**
 * Notifies every other participant on the trip that this user triggered the SOS
 * button. The 112 / emergency-contact calls themselves happen entirely client-side
 * (tel: links) — this action only handles the "let the others know" part, which needs
 * the service-role client because `notifications` has no `authenticated` write policy.
 */
export async function triggerSosAction(tripId: string): Promise<ActionResult> {
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

  const { data: passengerRows, error: passengersError } = await supabase
    .from("passengers")
    .select("*")
    .eq("trip_id", tripId);
  if (passengersError) throw passengersError;

  const participantIds = new Set([trip.driver_id, ...passengerRows.map((row) => row.user_id)]);
  if (!participantIds.has(user.id)) {
    return { success: false, error: "No formas parte de este viaje." };
  }
  participantIds.delete(user.id);

  const { data: sender } = await supabase
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const admin = createAdminClient();
  await Promise.all(
    [...participantIds].map((participantId) =>
      admin.from("notifications").insert({
        user_id: participantId,
        type: "sos_alert",
        title: "🆘 Alerta SOS",
        body: `${sender?.first_name ?? "Un participante"} ha activado el botón SOS en el viaje.`,
        data: { trip_id: tripId },
      })
    )
  );

  return { success: true };
}
