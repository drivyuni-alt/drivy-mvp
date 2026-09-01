"use client";

import { RouteMap } from "@/components/maps/RouteMap";
import { Badge, Card, CardContent, Skeleton } from "@/components/ui";
import { BookingPanel } from "@/features/bookings/components/BookingPanel";
import { BookingRequestsPanel } from "@/features/bookings/components/BookingRequestsPanel";
import { PassengerRatingList } from "@/features/bookings/components/PassengerRatingList";
import { useProfileDetails } from "@/features/profile/hooks";
import { PassengerLiveStatus } from "@/features/route-assistant/components/PassengerLiveStatus";
import { RouteAssistantPanel } from "@/features/route-assistant/components/RouteAssistantPanel";
import { LiveLocationShare } from "@/features/safety/components/LiveLocationShare";
import { SafetyActions } from "@/features/safety/components/SafetyActions";
import { SOSButton } from "@/features/safety/components/SOSButton";
import { formatDateTime, formatPrice } from "@/lib/format";

import { useTrip } from "../hooks";
import { CancelTripButton } from "./CancelTripButton";

export function TripDetailScreen({
  tripId,
  currentUserId,
}: {
  tripId: string;
  currentUserId: string;
}) {
  const tripQuery = useTrip(tripId);
  const currentUserProfile = useProfileDetails(currentUserId);

  if (tripQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!tripQuery.data) {
    return (
      <Card>
        <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">
          No hemos encontrado este viaje.
        </CardContent>
      </Card>
    );
  }

  const { trip, driver, vehicle } = tripQuery.data;
  const isDriver = driver.id === currentUserId;

  return (
    <div className="flex flex-col gap-6">
      <RouteMap
        origin={{ lat: trip.origin_lat, lng: trip.origin_lng }}
        destination={{ lat: trip.destination_lat, lng: trip.destination_lng }}
        className="h-56 w-full overflow-hidden rounded-2xl"
      />

      <div>
        <p className="text-sm font-semibold text-ink-900 dark:text-white">{trip.origin_address}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          → {trip.destination_address}
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {formatDateTime(trip.departure_at)}
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            {driver.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
              <img src={driver.avatar_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">
              {driver.first_name} {driver.last_name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ⭐ {driver.rating_avg.toFixed(1)} ({driver.rating_count} viajes) · {vehicle.make}{" "}
              {vehicle.model}, {vehicle.color}
            </p>
          </div>
        </div>
        {trip.notes && (
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">“{trip.notes}”</p>
        )}
        {!isDriver && (
          <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <SafetyActions
              currentUserId={currentUserId}
              targetUserId={driver.id}
              targetUserName={driver.first_name}
              tripId={trip.id}
            />
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2">
        <Badge variant="brand">{formatPrice(trip.price_per_seat)} / plaza</Badge>
        <Badge variant="outline">
          {trip.available_seats} plaza{trip.available_seats === 1 ? "" : "s"} libres
        </Badge>
        {trip.auto_accept_bookings && <Badge variant="success">Aceptación automática</Badge>}
      </div>

      {trip.status === "in_progress" && (
        <div className="flex flex-col gap-3">
          <LiveLocationShare tripId={trip.id} currentUserId={currentUserId} />
          {currentUserProfile.data && (
            <SOSButton tripId={trip.id} profile={currentUserProfile.data.profile} />
          )}
        </div>
      )}

      {isDriver ? (
        <>
          <RouteAssistantPanel trip={trip} />
          {trip.status === "completed" ? (
            <PassengerRatingList tripId={trip.id} driverId={currentUserId} />
          ) : (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">
                Solicitudes de reserva
              </h2>
              <BookingRequestsPanel tripId={trip.id} />
            </div>
          )}
          {trip.status === "scheduled" && <CancelTripButton tripId={trip.id} />}
        </>
      ) : (
        <>
          {trip.status === "in_progress" && (
            <PassengerLiveStatus tripId={trip.id} userId={currentUserId} />
          )}
          <BookingPanel tripWithDriver={tripQuery.data} passengerId={currentUserId} />
        </>
      )}
    </div>
  );
}
