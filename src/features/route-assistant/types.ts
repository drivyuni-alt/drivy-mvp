import type { Tables } from "@/lib/supabase/types";

export interface PassengerWithProfile {
  passenger: Tables<"passengers">;
  booking: Tables<"bookings">;
  user: Tables<"users">;
}

/**
 * Tiempos reales de Google Directions, medidos en el navegador del conductor y enviados al
 * servidor para que los guarde. Ver el porqué de este rodeo en directions.ts.
 *
 * Van indexados por pasajero y no como una lista ordenada a propósito: así el servidor no
 * tiene que dar por supuesto que el orden que calculó el cliente es el mismo que calcula él.
 */
export interface RealRouteTimings {
  /** Segundos desde la salida hasta recoger a cada pasajero. */
  etaSecondsByPassengerId: Record<string, number>;
  /** Segundos del trayecto completo, origen → recogidas → destino. */
  totalDurationSeconds: number;
  /** Si los tiempos incluyen el tráfico del momento o son los de un día cualquiera. */
  withTraffic: boolean;
}
