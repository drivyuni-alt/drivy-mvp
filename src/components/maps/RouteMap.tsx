"use client";

import { useEffect, useState } from "react";
import { DirectionsRenderer, GoogleMap, Marker } from "@react-google-maps/api";

import { Card } from "@/components/ui";
import {
  estimateDurationMinutes,
  formatDistanceKm,
  formatDurationMinutes,
  haversineDistanceKm,
} from "@/lib/geo";
import type { LatLng } from "@/lib/geo";

import { useGoogleMaps } from "./GoogleMapsProvider";

interface RouteMapProps {
  origin: LatLng;
  destination: LatLng;
  /** Posición del conductor mientras la ruta está en curso; se pinta como coche en el mapa. */
  driverLocation?: LatLng | null;
  className?: string;
}

const containerStyle: React.CSSProperties = { width: "100%", height: "100%" };

export function RouteMap({ origin, destination, driverLocation, className }: RouteMapProps) {
  const { isLoaded } = useGoogleMaps();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) setDirections(result);
      }
    );
  }, [isLoaded, origin, destination]);

  if (!isLoaded) {
    const distanceKm = haversineDistanceKm(origin, destination);
    return (
      <Card className={className}>
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-2xl" aria-hidden>
            🗺️
          </span>
          <p className="text-sm font-medium text-ink-900 dark:text-white">Mapa no disponible</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Configura <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para ver el mapa interactivo.
            Distancia estimada en línea recta: {formatDistanceKm(distanceKm)} (~
            {formatDurationMinutes(estimateDurationMinutes(distanceKm))} en coche).
          </p>
        </div>
      </Card>
    );
  }

  const center = {
    lat: (origin.lat + destination.lat) / 2,
    lng: (origin.lng + destination.lng) / 2,
  };

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverLocation ?? center}
        zoom={driverLocation ? 14 : 11}
      >
        {directions ? (
          <DirectionsRenderer directions={directions} />
        ) : (
          <>
            <Marker position={origin} label="A" />
            <Marker position={destination} label="B" />
          </>
        )}
        {driverLocation && (
          <Marker
            position={driverLocation}
            title="Tu conductor"
            zIndex={1000}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#111827",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
