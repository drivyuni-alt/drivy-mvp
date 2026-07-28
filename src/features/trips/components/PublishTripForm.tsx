"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { PlaceAutocompleteInput } from "@/components/maps/PlaceAutocompleteInput";
import { Button, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { AddVehicleForm } from "@/features/vehicles/components/AddVehicleForm";

import { useCreateTrip, useVehiclesForUser } from "../hooks";
import type { CreateTripInput } from "../types";

interface PlaceState {
  address: string;
  lat: number;
  lng: number;
}

const EMPTY_PLACE: PlaceState = { address: "", lat: 0, lng: 0 };

export function PublishTripForm({ driverId }: { driverId: string }) {
  const router = useRouter();
  const vehicles = useVehiclesForUser(driverId);
  const createTrip = useCreateTrip();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<PlaceState>(EMPTY_PLACE);
  const [destination, setDestination] = useState<PlaceState>(EMPTY_PLACE);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("3");
  const [price, setPrice] = useState("3.50");
  const [autoAccept, setAutoAccept] = useState(false);
  const [notes, setNotes] = useState("");

  if (vehicles.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const hasVehicles = Boolean(vehicles.data && vehicles.data.length > 0);
  if (!hasVehicles) {
    return (
      <AddVehicleForm
        ownerId={driverId}
        onCreated={(vehicleId) => setSelectedVehicleId(vehicleId)}
      />
    );
  }

  const vehicleId = selectedVehicleId ?? vehicles.data![0]!.id;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !time) return;

    const input: CreateTripInput = {
      driverId,
      vehicleId,
      originAddress: origin.address,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationAddress: destination.address,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      departureAt: new Date(`${date}T${time}`).toISOString(),
      availableSeats: Number(seats),
      pricePerSeat: Number(price),
      autoAcceptBookings: autoAccept,
      notes,
    };

    createTrip.mutate(input, {
      onSuccess: (trip) => router.push(`/trips/${trip.id}`),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {vehicles.data!.length > 1 && (
        <Select
          label="Vehículo"
          value={vehicleId}
          onChange={(event) => setSelectedVehicleId(event.target.value)}
          options={vehicles.data!.map((vehicle) => ({
            value: vehicle.id,
            label: `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`,
          }))}
        />
      )}

      <PlaceAutocompleteInput
        label="Origen"
        placeholder="Dirección de salida"
        value={origin.address}
        onChange={(address) => setOrigin((prev) => ({ ...prev, address }))}
        onPlaceSelected={setOrigin}
        required
      />
      <PlaceAutocompleteInput
        label="Destino"
        placeholder="Dirección de llegada"
        value={destination.address}
        onChange={(address) => setDestination((prev) => ({ ...prev, address }))}
        onPlaceSelected={setDestination}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha de salida"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Input
          label="Hora de salida"
          type="time"
          required
          value={time}
          onChange={(event) => setTime(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Plazas disponibles"
          type="number"
          min={1}
          max={7}
          required
          value={seats}
          onChange={(event) => setSeats(event.target.value)}
        />
        <Input
          label="Precio por plaza (€)"
          type="number"
          min={0}
          step="0.5"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-900 dark:text-neutral-200">
        <input
          type="checkbox"
          checked={autoAccept}
          onChange={(event) => setAutoAccept(event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
        />
        Aceptar reservas automáticamente
      </label>

      <Textarea
        label="Notas para los pasajeros (opcional)"
        placeholder="Ej: tengo hueco para una maleta pequeña"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      {createTrip.isError && (
        <p className="text-sm text-danger">No se pudo publicar el viaje. Inténtalo de nuevo.</p>
      )}

      <Button type="submit" size="lg" isLoading={createTrip.isPending}>
        Publicar viaje
      </Button>
    </form>
  );
}
