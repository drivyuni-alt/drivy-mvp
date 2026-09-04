"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { haversineDistanceKm } from "@/lib/geo";
import type { LatLng } from "@/lib/geo";

export interface DriverLocation extends LatLng {
  heading: number | null;
  updatedAt: string;
}

/** No se escribe más de una vez cada 8 s aunque el GPS dispare mucho más a menudo. */
const MIN_INTERVAL_MS = 8_000;
/** …salvo que el coche se haya movido esto, en cuyo caso interesa actualizar antes. */
const MIN_DISTANCE_KM = 0.05; // 50 metros

/**
 * El conductor publica su posición mientras la ruta está en curso.
 *
 * Se escribe en `trip_driver_locations` en vez de emitir por un canal efímero para que el
 * pasajero que abre la app a mitad de trayecto vea dónde está el coche de inmediato, sin
 * esperar a la siguiente emisión — que es justo el momento en que necesita saberlo para
 * decidir si baja ya.
 *
 * Doble freno por batería y por escrituras: `watchPosition` puede disparar cada segundo,
 * así que sólo se guarda si han pasado 8 s o si el coche se ha movido 50 m. Parado en un
 * semáforo no genera tráfico.
 */
export function usePublishDriverLocation({
  tripId,
  driverId,
  enabled,
}: {
  tripId: string;
  driverId: string;
  enabled: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  /**
   * Arrancar `watchPosition` solo, nada más cargar la página, no funciona de forma fiable:
   * los navegadores esperan un gesto del usuario para mostrar el diálogo de permiso y, si
   * no lo hay, lo ignoran o lo bloquean en silencio. Por eso sólo se arranca solo cuando el
   * permiso YA está concedido; en cualquier otro caso hace falta que el conductor pulse.
   */
  const [started, setStarted] = useState(false);
  const [permission, setPermission] = useState<PermissionState | "unknown">("unknown");
  const lastSentAtRef = useRef(0);
  const lastPositionRef = useRef<LatLng | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.permissions) return;
    let cancelled = false;

    void navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setPermission(status.state);
        if (status.state === "granted") setStarted(true);
      })
      .catch(() => {
        // Safari antiguo no expone permissions.query para geolocation: se queda en
        // "unknown" y el conductor tendrá que pulsar el botón, que es el camino seguro.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !started) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Tu dispositivo no permite compartir la ubicación.");
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (cancelled) return;

        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        const elapsed = Date.now() - lastSentAtRef.current;
        const movedKm = lastPositionRef.current
          ? haversineDistanceKm(lastPositionRef.current, next)
          : Infinity;

        if (elapsed < MIN_INTERVAL_MS && movedKm < MIN_DISTANCE_KM) return;

        lastSentAtRef.current = Date.now();
        lastPositionRef.current = next;

        void supabase
          .from("trip_driver_locations")
          .upsert(
            {
              trip_id: tripId,
              driver_id: driverId,
              lat: next.lat,
              lng: next.lng,
              heading: Number.isFinite(position.coords.heading) ? position.coords.heading : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "trip_id" }
          )
          .then(({ error: upsertError }) => {
            if (!cancelled) setError(upsertError ? "No se pudo actualizar tu ubicación." : null);
          });
      },
      (positionError) => {
        if (cancelled) return;
        setStarted(false);
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Has bloqueado la ubicación para Drivy. Actívala en los ajustes del navegador para que tus pasajeros te vean."
            : "No hemos podido acceder a tu ubicación. Comprueba que el GPS está encendido."
        );
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tripId, driverId, enabled, started]);

  return {
    error,
    isSharing: started && error === null,
    /** Debe llamarse desde un clic real: es lo que hace que el navegador muestre el diálogo. */
    start: () => {
      setError(null);
      setStarted(true);
    },
    needsPermission: permission !== "granted",
  };
}

/**
 * El pasajero sigue la posición del conductor: una lectura inicial (para tener algo que
 * pintar al abrir) más la suscripción a los cambios de esa fila.
 */
export function useDriverLocation({ tripId, enabled }: { tripId: string; enabled: boolean }) {
  const [location, setLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLocation(null);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    function apply(row: {
      lat: number;
      lng: number;
      heading: number | null;
      updated_at: string;
    }) {
      if (cancelled) return;
      setLocation({ lat: row.lat, lng: row.lng, heading: row.heading, updatedAt: row.updated_at });
    }

    void supabase
      .from("trip_driver_locations")
      .select("lat, lng, heading, updated_at")
      .eq("trip_id", tripId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) apply(data);
      });

    const channel = supabase
      .channel(`driver-location:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_driver_locations",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const row = payload.new as {
            lat: number;
            lng: number;
            heading: number | null;
            updated_at: string;
          } | null;
          if (row?.lat != null) apply(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tripId, enabled]);

  return location;
}
