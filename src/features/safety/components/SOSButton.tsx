"use client";

import { useState } from "react";

import { Button, Modal } from "@/components/ui";
import type { Tables } from "@/lib/supabase/types";

import { useTriggerSos } from "../hooks";

export function SOSButton({ tripId, profile }: { tripId: string; profile: Tables<"users"> }) {
  const [open, setOpen] = useState(false);
  const triggerSos = useTriggerSos();

  return (
    <>
      <Button variant="danger" className="w-full" onClick={() => setOpen(true)}>
        🆘 SOS
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="¿Necesitas ayuda?">
        <div className="flex flex-col gap-3">
          <a href="tel:112">
            <Button variant="danger" className="w-full">
              Llamar al 112
            </Button>
          </a>

          {profile.emergency_contact_phone && (
            <a href={`tel:${profile.emergency_contact_phone}`}>
              <Button variant="outline" className="w-full">
                Llamar a {profile.emergency_contact_name || "tu contacto de emergencia"}
              </Button>
            </a>
          )}

          <Button
            variant="outline"
            isLoading={triggerSos.isPending}
            onClick={() => triggerSos.mutate(tripId)}
          >
            Avisar a los demás participantes del viaje
          </Button>

          {triggerSos.isSuccess && triggerSos.data.success && (
            <p className="text-sm text-success">Se ha avisado a los demás participantes.</p>
          )}
          {triggerSos.data && !triggerSos.data.success && (
            <p className="text-sm text-danger">{triggerSos.data.error}</p>
          )}
        </div>
      </Modal>
    </>
  );
}
