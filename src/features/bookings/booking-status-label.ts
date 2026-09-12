import type { Tables } from "@/lib/supabase/types";

/**
 * Etiqueta de cada estado de reserva tal como se le enseña al conductor.
 *
 * Existe porque `BookingRequestsPanel` decidía la etiqueta con un ternario
 * (`accepted ? "Aceptada" : "Rechazada"`), y eso convertía en "Rechazada" todo lo que no
 * fuese una aceptación. Se vio al cancelar un viaje entero: las reservas pasan a
 * `cancelled`, y el panel le contaba al conductor que había rechazado él a esos pasajeros.
 *
 * `TripCard` mantiene su propio mapa a propósito: le habla al pasajero, y ahí "accepted" se
 * dice "Confirmada", no "Aceptada".
 */
export const BOOKING_STATUS_LABEL: Record<Tables<"bookings">["status"], string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  completed: "Completada",
};
