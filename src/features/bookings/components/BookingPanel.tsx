"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge, Button, Input, Modal, buttonVariants } from "@/components/ui";
import { PlaceAutocompleteInput } from "@/components/maps/PlaceAutocompleteInput";
import { useGoogleMaps } from "@/components/maps/GoogleMapsProvider";
import { useChatForBooking } from "@/features/chat/hooks";
import { useMatchingContext } from "@/features/matching/hooks";
import { scoreTrips } from "@/features/matching/scoring";
import { RatingPrompt } from "@/features/ratings/components/RatingPrompt";
import type { TripWithDriver } from "@/features/trips/types";
import { formatPrice } from "@/lib/format";

import { useCreateBooking, useMyBookingForTrip } from "../hooks";

const STATUS_COPY: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  pending: { label: "Solicitud enviada, esperando al conductor", variant: "warning" },
  accepted: { label: "¡Reserva confirmada!", variant: "success" },
  rejected: { label: "El conductor rechazó tu solicitud", variant: "danger" },
  cancelled: { label: "Reserva cancelada", variant: "neutral" },
  completed: { label: "Viaje completado", variant: "neutral" },
};

export function BookingPanel({
  tripWithDriver,
  passengerId,
}: {
  tripWithDriver: TripWithDriver;
  passengerId: string;
}) {
  const { trip, driver } = tripWithDriver;
  const myBooking = useMyBookingForTrip(trip.id, passengerId);
  const createBooking = useCreateBooking();
  // No search context at this point (the passenger landed directly on the trip page) —
  // the score stored on the booking reflects driver quality/known-driver only.
  const matchingContext = useMatchingContext(passengerId);
  const { isLoaded: mapsReady } = useGoogleMaps();
  const [modalOpen, setModalOpen] = useState(false);
  const [seats, setSeats] = useState("1");
  /**
   * Dónde recoger al pasajero. Antes no se preguntaba: se copiaba `trip.origin_address`,
   * así que el conductor veía a todo el mundo esperándole en su propia puerta y la "Ruta
   * inteligente" ordenaba puntos de recogida idénticos entre sí. Vacío = "me recoges en el
   * origen del viaje", que sigue siendo una opción legítima.
   */
  const [pickup, setPickup] = useState<{ address: string; lat: number | null; lng: number | null }>({
    address: "",
    lat: null,
    lng: null,
  });
  const [pickupError, setPickupError] = useState<string | null>(null);

  const chat = useChatForBooking(
    myBooking.data?.status === "accepted" ? myBooking.data.id : undefined
  );

  if (myBooking.isLoading) return null;

  if (myBooking.data) {
    const status = STATUS_COPY[myBooking.data.status];
    return (
      <div className="flex flex-col gap-2">
        {status && <Badge variant={status.variant}>{status.label}</Badge>}
        {chat.data && (
          <Link href={`/chats/${chat.data.id}`} className={buttonVariants({ variant: "outline" })}>
            Chatear con el conductor
          </Link>
        )}
        {myBooking.data.status === "completed" && (
          <RatingPrompt
            tripId={trip.id}
            bookingId={myBooking.data.id}
            raterId={passengerId}
            rateeId={driver.id}
            rateeName={driver.first_name}
            includeDriving
          />
        )}
      </div>
    );
  }

  function handleConfirm() {
    const seatsRequested = Number(seats);
    const [scored] = scoreTrips([tripWithDriver], matchingContext);

    // Escribir la dirección sin elegirla del desplegable no la geocodifica, y el conductor
    // acabaría con un texto que la ruta no puede usar. Mismo criterio que en publicar viaje.
    const typedButNotPicked = pickup.address.trim() !== "" && pickup.lat === null;
    if (mapsReady && typedButNotPicked) {
      setPickupError("Elige tu dirección de recogida de la lista de sugerencias.");
      return;
    }
    setPickupError(null);

    const usesOwnPickup = pickup.lat !== null && pickup.lng !== null;

    createBooking.mutate(
      {
        tripId: trip.id,
        passengerId,
        seatsRequested,
        pickupAddress: usesOwnPickup ? pickup.address : trip.origin_address,
        pickupLat: usesOwnPickup ? pickup.lat! : trip.origin_lat,
        pickupLng: usesOwnPickup ? pickup.lng! : trip.origin_lng,
        dropoffAddress: trip.destination_address,
        dropoffLat: trip.destination_lat,
        dropoffLng: trip.destination_lng,
        priceTotal: trip.price_per_seat * seatsRequested,
        matchScore: scored?.matchScore ?? null,
      },
      { onSuccess: () => setModalOpen(false) }
    );
  }

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setModalOpen(true)}>
        Reservar plaza
      </Button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirmar reserva"
        description={`${trip.origin_address} → ${trip.destination_address}`}
      >
        <div className="flex flex-col gap-4">
          <PlaceAutocompleteInput
            label="¿Dónde te recogemos?"
            placeholder="Tu dirección de recogida"
            value={pickup.address}
            onChange={(address) => setPickup({ address, lat: null, lng: null })}
            onPlaceSelected={setPickup}
            hint="Déjalo vacío si vas directamente al punto de salida del conductor."
          />
          {pickupError && <p className="text-sm text-danger">{pickupError}</p>}

          <Input
            label="Plazas"
            type="number"
            min={1}
            max={trip.available_seats}
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Total: <span className="font-semibold text-ink-900 dark:text-white">
              {formatPrice(trip.price_per_seat * Number(seats || 0))}
            </span>
          </p>

          {createBooking.isError && (
            <p className="text-sm text-danger">No se pudo crear la reserva. Inténtalo de nuevo.</p>
          )}
          {createBooking.data && !createBooking.data.success && (
            <p className="text-sm text-danger">{createBooking.data.error}</p>
          )}

          <Button onClick={handleConfirm} isLoading={createBooking.isPending}>
            Confirmar reserva
          </Button>
        </div>
      </Modal>
    </>
  );
}
