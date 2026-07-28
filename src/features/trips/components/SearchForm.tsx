"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button, Input } from "@/components/ui";
import { PlaceAutocompleteInput } from "@/components/maps/PlaceAutocompleteInput";

import type { TripSearchParams } from "../types";

interface SearchFormProps {
  initialValues?: Partial<TripSearchParams>;
  onSubmit: (params: TripSearchParams) => void;
  isLoading?: boolean;
  compact?: boolean;
}

interface PlaceState {
  address: string;
  lat: number | null;
  lng: number | null;
}

function toPlaceState(address?: string, lat?: number | null, lng?: number | null): PlaceState {
  return { address: address ?? "", lat: lat ?? null, lng: lng ?? null };
}

export function SearchForm({ initialValues, onSubmit, isLoading, compact }: SearchFormProps) {
  const [origin, setOrigin] = useState<PlaceState>(
    toPlaceState(initialValues?.originQuery, initialValues?.originLat, initialValues?.originLng)
  );
  const [destination, setDestination] = useState<PlaceState>(
    toPlaceState(
      initialValues?.destinationQuery,
      initialValues?.destinationLat,
      initialValues?.destinationLng
    )
  );
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [time, setTime] = useState(initialValues?.time ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      originQuery: origin.address,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationQuery: destination.address,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      date,
      time,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <PlaceAutocompleteInput
        label="Origen"
        placeholder="¿Desde dónde sales?"
        value={origin.address}
        onChange={(address) => setOrigin({ address, lat: null, lng: null })}
        onPlaceSelected={setOrigin}
      />
      <PlaceAutocompleteInput
        label="Destino"
        placeholder="¿A dónde vas?"
        value={destination.address}
        onChange={(address) => setDestination({ address, lat: null, lng: null })}
        onPlaceSelected={setDestination}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Input
          label="Hora"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
        />
      </div>
      <Button type="submit" size={compact ? "md" : "lg"} isLoading={isLoading}>
        Buscar viajes
      </Button>
    </form>
  );
}
