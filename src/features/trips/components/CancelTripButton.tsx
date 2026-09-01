"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button, Modal } from "@/components/ui";

import { cancelTripAction } from "../actions";

/**
 * Cancelar es destructivo y avisa a todos los pasajeros, así que va detrás de una
 * confirmación explícita en vez de dispararse con un solo clic.
 */
export function CancelTripButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const cancelTrip = useMutation({
    mutationFn: async () => {
      const result = await cancelTripAction(tripId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setOpen(false);
    },
  });

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Cancelar viaje
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Cancelar viaje">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Se avisará a todos los pasajeros con reserva y sus reservas quedarán canceladas.
            Esta acción no se puede deshacer.
          </p>

          {cancelTrip.isError && (
            <p className="text-sm text-danger">{cancelTrip.error.message}</p>
          )}

          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              isLoading={cancelTrip.isPending}
              onClick={() => cancelTrip.mutate()}
            >
              Sí, cancelar el viaje
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Volver
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
