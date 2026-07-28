"use client";

import { useState } from "react";

import { Badge, Button, Modal, Textarea } from "@/components/ui";

import { useMyRatingForBooking, useSubmitRating } from "../hooks";
import { StarRating } from "./StarRating";

export function RatingPrompt({
  tripId,
  bookingId,
  raterId,
  rateeId,
  rateeName,
  includeDriving,
}: {
  tripId: string;
  bookingId: string;
  raterId: string;
  rateeId: string;
  rateeName: string;
  includeDriving: boolean;
}) {
  const myRating = useMyRatingForBooking(bookingId, raterId);
  const submitRating = useSubmitRating();
  const [open, setOpen] = useState(false);
  const [punctuality, setPunctuality] = useState(5);
  const [friendliness, setFriendliness] = useState(5);
  const [driving, setDriving] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comment, setComment] = useState("");

  if (myRating.isLoading) return null;

  if (myRating.data) {
    return <Badge variant="success">Ya has valorado a {rateeName}</Badge>;
  }

  function handleSubmit() {
    submitRating.mutate(
      {
        tripId,
        bookingId,
        raterId,
        rateeId,
        punctuality,
        friendliness,
        communication,
        driving: includeDriving ? driving : null,
        comment,
      },
      { onSuccess: () => setOpen(false) }
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Valorar a {rateeName}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Valorar a ${rateeName}`}>
        <div className="flex flex-col gap-4">
          <StarRating label="Puntualidad" value={punctuality} onChange={setPunctuality} />
          <StarRating label="Amabilidad" value={friendliness} onChange={setFriendliness} />
          {includeDriving && (
            <StarRating label="Conducción" value={driving} onChange={setDriving} />
          )}
          <StarRating label="Comunicación" value={communication} onChange={setCommunication} />
          <Textarea
            label="Comentario (opcional)"
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />

          {submitRating.data && !submitRating.data.success && (
            <p className="text-sm text-danger">{submitRating.data.error}</p>
          )}

          <Button onClick={handleSubmit} isLoading={submitRating.isPending}>
            Enviar valoración
          </Button>
        </div>
      </Modal>
    </>
  );
}
