"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge, Card, CardContent, Skeleton, buttonVariants } from "@/components/ui";
import { useMatchingContext } from "@/features/matching/hooks";
import { getRecommendedTrips } from "@/features/matching/scoring";
import { useBlockedUserIds } from "@/features/safety/hooks";

import { useSearchTrips, useUpcomingTrips } from "../hooks";
import type { TripSearchParams } from "../types";
import { SearchForm } from "./SearchForm";
import { TripCard } from "./TripCard";

function searchParamsToQueryString(params: TripSearchParams): string {
  const query = new URLSearchParams();
  if (params.originQuery) query.set("origin", params.originQuery);
  if (params.originLat != null) query.set("originLat", String(params.originLat));
  if (params.originLng != null) query.set("originLng", String(params.originLng));
  if (params.destinationQuery) query.set("destination", params.destinationQuery);
  if (params.destinationLat != null) query.set("destinationLat", String(params.destinationLat));
  if (params.destinationLng != null) query.set("destinationLng", String(params.destinationLng));
  if (params.date) query.set("date", params.date);
  if (params.time) query.set("time", params.time);
  return query.toString();
}

export function HomeScreen({ userId, firstName }: { userId: string; firstName: string }) {
  const router = useRouter();

  const allOpenTrips = useSearchTrips({ originQuery: "", destinationQuery: "" });
  const upcoming = useUpcomingTrips(userId);
  const blockedUserIds = useBlockedUserIds(userId);
  // No search criteria on the home feed yet, so the engine falls back to driver
  // rating/punctuality/known-driver only — see docs/05-matching.md.
  const matchingContext = useMatchingContext(userId);

  const recommended = allOpenTrips.data
    ? getRecommendedTrips(
        allOpenTrips.data.filter(
          (item) => item.trip.driver_id !== userId && !blockedUserIds.data?.has(item.trip.driver_id)
        ),
        matchingContext,
        4
      )
    : [];

  function handleSearch(params: TripSearchParams) {
    const query = searchParamsToQueryString(params);
    router.push(`/trips/search${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Hola, {firstName} 👋</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900 dark:text-white">
          ¿A dónde vas hoy?
        </h1>
      </div>

      <Card className="p-4 sm:p-5">
        <SearchForm onSubmit={handleSearch} compact />
      </Card>

      <div className="flex gap-3">
        <Link href="/trips/new" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
          Publicar viaje
        </Link>
        <Link href="/trips/search" className={buttonVariants({ variant: "ghost", className: "flex-1" })}>
          Ver todos los viajes
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white">
            Recomendados para ti
          </h2>
          <Badge variant="brand">IA</Badge>
        </div>

        {allOpenTrips.isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : recommended.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">
              Todavía no hay viajes disponibles que recomendarte. Prueba a buscar con otros
              filtros o publica tú un viaje.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {recommended.map((item) => (
              <TripCard
                key={item.trip.id}
                trip={item.trip}
                driver={item.driver}
                matchScore={item.matchScore}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">
          Tus próximos viajes
        </h2>

        {upcoming.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !upcoming.data || upcoming.data.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">
              No tienes ningún viaje programado todavía.
            </CardContent>
          </Card>
        ) : (
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
        )}
      </section>
    </div>
  );
}
