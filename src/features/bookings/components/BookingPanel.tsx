"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge, Button, Input, Modal, buttonVariants } from "@/components/ui";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [seats, setSeats] = useState("1");

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

    createBooking.mutate(
      {
        tripId: trip.id,
        passengerId,
        seatsRequested,
        pickupAddress: trip.origin_address,
        pickupLat: trip.origin_lat,
        pickupLng: trip.origin_lng,
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
