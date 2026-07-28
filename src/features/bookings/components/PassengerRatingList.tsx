"use client";

import { Card } from "@/components/ui";
import { RatingPrompt } from "@/features/ratings/components/RatingPrompt";

import { useBookingsForTrip } from "../hooks";

export function PassengerRatingList({ tripId, driverId }: { tripId: string; driverId: string }) {
  const bookings = useBookingsForTrip(tripId);
  const completed = (bookings.data ?? []).filter((item) => item.booking.status === "completed");

  if (completed.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Valorar pasajeros</h3>
      {completed.map(({ booking, passenger }) => (
        <div key={booking.id} className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-900 dark:text-white">
            {passenger.first_name} {passenger.last_name}
          </span>
          <RatingPrompt
            tripId={tripId}
            bookingId={booking.id}
            raterId={driverId}
            rateeId={passenger.id}
            rateeName={passenger.first_name}
            includeDriving={false}
          />
        </div>
      ))}
    </Card>
  );
}
