import type { Tables } from "@/lib/supabase/types";

export interface PassengerWithProfile {
  passenger: Tables<"passengers">;
  booking: Tables<"bookings">;
  user: Tables<"users">;
}

/**
 * Medidas reales de Google Directions, tomadas en el navegador del conductor y enviadas al
 * servidor para que las guarde. Ver el porqué de este rodeo en directions.ts.
 *
 * Los ETA van indexados por pasajero y no como una lista ordenada a propósito: así el
 * servidor no tiene que dar por supuesto que el orden que calculó el cliente es el mismo que
 * calcula él.
 */
export interface RealRouteMetrics {
  /** Segundos desde la salida hasta recoger a cada pasajero. */
  etaSecondsByPassengerId: Record<string, number>;
  /** Segundos del trayecto completo, origen → recogidas → destino. */
  totalDurationSeconds: number;
  /** Metros por carretera del trayecto completo, no en línea recta. */
  totalDistanceMeters: number;
  /** Si los tiempos incluyen el tráfico del momento o son los de un día cualquiera. */
  withTraffic: boolean;
}
