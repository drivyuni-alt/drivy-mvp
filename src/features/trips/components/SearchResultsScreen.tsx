"use client";

import { useState } from "react";

import { Card, CardContent, Skeleton } from "@/components/ui";
import { useMatchingContext } from "@/features/matching/hooks";
import { scoreTrips } from "@/features/matching/scoring";
import { useBlockedUserIds } from "@/features/safety/hooks";

import { useSearchTrips } from "../hooks";
import type { TripSearchParams } from "../types";
import { SearchForm } from "./SearchForm";
import { TripCard } from "./TripCard";

export function SearchResultsScreen({
  initialParams,
  passengerId,
}: {
  initialParams: TripSearchParams;
  passengerId: string;
}) {
  const [params, setParams] = useState(initialParams);
  const results = useSearchTrips(params);
  const blockedUserIds = useBlockedUserIds(passengerId);
  const matchingContext = useMatchingContext(passengerId, {
    originLat: params.originLat,
    originLng: params.originLng,
    destinationLat: params.destinationLat,
    destinationLng: params.destinationLng,
    date: params.date,
    time: params.time,
  });
  const visibleResults = results.data?.filter(
    (item) => !blockedUserIds.data?.has(item.trip.driver_id)
  );
  const scored = visibleResults ? scoreTrips(visibleResults, matchingContext) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Buscar viaje</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Ordenados por compatibilidad con tu búsqueda.
        </p>
      </div>

      <Card className="p-4 sm:p-5">
        <SearchForm initialValues={params} onSubmit={setParams} compact />
      </Card>

      {results.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : scored.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-neutral-500 dark:text-neutral-400">
            No hemos encontrado viajes con estos filtros. Prueba a ampliar la búsqueda.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {scored.map((item) => (
            <TripCard
              key={item.trip.id}
              trip={item.trip}
              driver={item.driver}
              matchScore={item.matchScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
