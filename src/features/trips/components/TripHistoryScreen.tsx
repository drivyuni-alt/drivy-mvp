"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge, Card, CardContent, Skeleton } from "@/components/ui";
import { useMyBookings } from "@/features/bookings/hooks";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { useTripHistory, useUpcomingTrips } from "../hooks";
import { TripCard } from "./TripCard";

type Tab = "upcoming" | "completed" | "cancelled" | "bookings";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Próximos" },
  { key: "completed", label: "Completados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "bookings", label: "Reservas" },
];

const BOOKING_STATUS_LABEL: Record<Tables<"bookings">["status"], string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export function TripHistoryScreen({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Mis viajes</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === item.key
                ? "bg-brand text-ink-900"
                : "bg-neutral-100 text-neutral-500 hover:text-ink-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "upcoming" && <UpcomingTab userId={userId} />}
      {tab === "completed" && (
        <TripStatusTab userId={userId} status="completed" emptyText="No tienes viajes completados todavía." />
      )}
      {tab === "cancelled" && (
        <TripStatusTab userId={userId} status="cancelled" emptyText="No tienes viajes cancelados." />
      )}
      {tab === "bookings" && <BookingsTab userId={userId} />}
    </div>
  );
}

function UpcomingTab({ userId }: { userId: string }) {
  const upcoming = useUpcomingTrips(userId);

  if (upcoming.isLoading) return <Skeleton className="h-32 w-full" />;
  if (!upcoming.data || upcoming.data.length === 0) {
    return <EmptyState text="No tienes ningún viaje programado." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {upcoming.data.map((item) => (
        <TripCard
          key={item.trip.id}
          trip={item.trip}
          driver={item.driver}
          role={item.role}
          bookingStatus={item.booking?.status}
        />
      ))}
    </div>
  );
}

function TripStatusTab({
  userId,
  status,
  emptyText,
}: {
  userId: string;
  status: Tables<"trips">["status"];
  emptyText: string;
}) {
  const history = useTripHistory(userId, [status]);

  if (history.isLoading) return <Skeleton className="h-32 w-full" />;
  if (!history.data || history.data.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div className="flex flex-col gap-3">
      {history.data.map((item) => (
        <TripCard
          key={item.trip.id}
          trip={item.trip}
          driver={item.driver}
          role={item.role}
          bookingStatus={item.booking?.status}
        />
      ))}
    </div>
  );
}

function BookingsTab({ userId }: { userId: string }) {
  const bookings = useMyBookings(userId);

  if (bookings.isLoading) return <Skeleton className="h-32 w-full" />;
  if (!bookings.data || bookings.data.length === 0) {
    return <EmptyState text="Todavía no has reservado ninguna plaza." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.data.map(({ booking, trip, driver }) => (
        <Link key={booking.id} href={`/trips/${trip.id}`}>
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                  {trip.origin_address} → {trip.destination_address}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {driver.first_name} · {formatDateTime(trip.departure_at)} ·{" "}
                  {formatPrice(booking.price_total)}
                </p>
              </div>
              <Badge
                variant={
                  booking.status === "accepted" || booking.status === "completed"
                    ? "success"
                    : booking.status === "rejected" || booking.status === "cancelled"
                      ? "danger"
                      : "warning"
                }
              >
                {BOOKING_STATUS_LABEL[booking.status]}
              </Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">{text}</CardContent>
    </Card>
  );
}
