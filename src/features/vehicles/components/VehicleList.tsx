"use client";

import { useState } from "react";

import { Button, Card } from "@/components/ui";
import { useDeleteVehicle } from "@/features/profile/hooks";
import type { Tables } from "@/lib/supabase/types";

import { AddVehicleForm } from "./AddVehicleForm";

export function VehicleList({ userId, vehicles }: { userId: string; vehicles: Tables<"vehicles">[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const deleteVehicle = useDeleteVehicle(userId);

  return (
    <div className="flex flex-col gap-3">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {vehicle.color} · {vehicle.plate} · {vehicle.seats} plazas
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            isLoading={deleteVehicle.isPending && deleteVehicle.variables === vehicle.id}
            onClick={() => deleteVehicle.mutate(vehicle.id)}
          >
            Eliminar
          </Button>
        </Card>
      ))}

      {showAddForm ? (
        <AddVehicleForm ownerId={userId} onCreated={() => setShowAddForm(false)} />
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)}>
          Añadir vehículo
        </Button>
      )}
    </div>
  );
}
