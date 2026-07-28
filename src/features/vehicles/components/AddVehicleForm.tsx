"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button, Card, CardContent, CardDescription, CardTitle, Input } from "@/components/ui";

import { useCreateVehicle } from "../hooks";
import type { CreateVehicleInput } from "../types";

export function AddVehicleForm({
  ownerId,
  onCreated,
}: {
  ownerId: string;
  onCreated: (vehicleId: string) => void;
}) {
  const createVehicle = useCreateVehicle();
  const [form, setForm] = useState({ make: "", model: "", color: "", plate: "", seats: "4" });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: CreateVehicleInput = {
      ownerId,
      make: form.make,
      model: form.model,
      color: form.color,
      plate: form.plate,
      seats: Number(form.seats),
    };
    createVehicle.mutate(input, {
      onSuccess: (vehicle) => onCreated(vehicle.id),
    });
  }

  return (
    <Card>
      <CardContent>
        <CardTitle>Añade tu vehículo</CardTitle>
        <CardDescription>Necesitas un vehículo registrado antes de publicar un viaje.</CardDescription>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marca"
              required
              value={form.make}
              onChange={(event) => update("make", event.target.value)}
            />
            <Input
              label="Modelo"
              required
              value={form.model}
              onChange={(event) => update("model", event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Color"
              required
              value={form.color}
              onChange={(event) => update("color", event.target.value)}
            />
            <Input
              label="Matrícula"
              required
              value={form.plate}
              onChange={(event) => update("plate", event.target.value.toUpperCase())}
            />
          </div>
          <Input
            label="Plazas totales (incluido el conductor)"
            type="number"
            min={2}
            max={8}
            required
            value={form.seats}
            onChange={(event) => update("seats", event.target.value)}
          />

          {createVehicle.isError && (
            <p className="text-sm text-danger">No se pudo guardar el vehículo. Inténtalo de nuevo.</p>
          )}

          <Button type="submit" isLoading={createVehicle.isPending}>
            Guardar vehículo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
