"use client";

import Link from "next/link";

import { Badge, Button, Card, buttonVariants } from "@/components/ui";
import { useChatForBooking } from "@/features/chat/hooks";
import type { BookingWithPassenger } from "@/features/bookings/types";

import { useBookingsForTrip, useRespondToBooking } from "../hooks";
import type { BookingDecision } from "../types";

export function BookingRequestsPanel({ tripId }: { tripId: string }) {
  const bookings = useBookingsForTrip(tripId);
  const respond = useRespondToBooking();

  if (bookings.isLoading) return null;
  if (!bookings.data || bookings.data.length === 0) {
    return (
      <Card className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
        Todavía no has recibido solicitudes de reserva para este viaje.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.data.map((item) => (
        <BookingRequestCard
          key={item.booking.id}
          item={item}
          isResponding={respond.isPending && respond.variables?.bookingId === item.booking.id}
          onRespond={(decision) => respond.mutate({ bookingId: item.booking.id, decision })}
        />
      ))}
    </div>
  );
}

function BookingRequestCard({
  item: { booking, passenger },
  isResponding,
  onRespond,
}: {
  item: BookingWithPassenger;
  isResponding: boolean;
  onRespond: (decision: BookingDecision) => void;
}) {
  const chat = useChatForBooking(booking.status === "accepted" ? booking.id : undefined);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            {passenger.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
              <img src={passenger.avatar_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">
              {passenger.first_name} {passenger.last_name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {booking.seats_requested} plaza{booking.seats_requested === 1 ? "" : "s"} · ⭐{" "}
              {passenger.rating_avg.toFixed(1)}
            </p>
            {/* Sin esto el conductor acepta a ciegas y no sabe por dónde pasar a recoger. */}
            {booking.pickup_address && (
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                📍 Recoger en: {booking.pickup_address}
              </p>
            )}
          </div>
        </div>

        {booking.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" isLoading={isResponding} onClick={() => onRespond("rejected")}>
              Rechazar
            </Button>
            <Button size="sm" isLoading={isResponding} onClick={() => onRespond("accepted")}>
              Aceptar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {chat.data && (
              <Link href={`/chats/${chat.data.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                Chatear
              </Link>
            )}
            <Badge variant={booking.status === "accepted" ? "success" : "danger"}>
              {booking.status === "accepted" ? "Aceptada" : "Rechazada"}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
