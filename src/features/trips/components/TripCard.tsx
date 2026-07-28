import Link from "next/link";

import { Badge, Card } from "@/components/ui";
import { MatchScoreBadge } from "@/features/matching/components/MatchScoreBadge";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";

interface TripCardProps {
  trip: Tables<"trips">;
  driver: Tables<"users">;
  matchScore?: number;
  role?: "driver" | "passenger";
  bookingStatus?: Tables<"bookings">["status"];
}

const BOOKING_STATUS_LABEL: Record<Tables<"bookings">["status"], string> = {
  pending: "Pendiente",
  accepted: "Confirmada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export function TripCard({ trip, driver, matchScore, role, bookingStatus }: TripCardProps) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="p-4 transition-shadow hover:shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
              {trip.origin_address}
            </p>
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
              → {trip.destination_address}
            </p>
          </div>
          {matchScore !== undefined && <MatchScoreBadge score={matchScore} />}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{formatDateTime(trip.departure_at)}</span>
          <span aria-hidden>·</span>
          <span>
            {trip.available_seats} plaza{trip.available_seats === 1 ? "" : "s"}
          </span>
          <span aria-hidden>·</span>
          <span className="font-semibold text-ink-900 dark:text-white">
            {formatPrice(trip.price_per_seat)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              {driver.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
                <img src={driver.avatar_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <span className="text-xs font-medium text-ink-900 dark:text-white">
              {driver.first_name} · ⭐ {driver.rating_avg.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {role === "driver" && <Badge variant="outline">Eres el conductor</Badge>}
            {bookingStatus && <Badge variant="neutral">{BOOKING_STATUS_LABEL[bookingStatus]}</Badge>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
