"use client";

import { useState } from "react";

import { Button, Modal, Select, Textarea } from "@/components/ui";
import type { Tables } from "@/lib/supabase/types";

import { useSubmitReport } from "../hooks";
import { REPORT_REASON_LABELS } from "../types";

const REASON_OPTIONS = (Object.keys(REPORT_REASON_LABELS) as Tables<"reports">["reason"][]).map(
  (value) => ({ value, label: REPORT_REASON_LABELS[value] })
);

export function ReportUserModal({
  open,
  onClose,
  reporterId,
  reportedUserId,
  reportedUserName,
  tripId,
}: {
  open: boolean;
  onClose: () => void;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  tripId: string | null;
}) {
  const submitReport = useSubmitReport();
  const [reason, setReason] = useState<Tables<"reports">["reason"]>("other");
  const [details, setDetails] = useState("");

  function handleSubmit() {
    submitReport.mutate(
      { reporterId, reportedUserId, tripId, reason, details },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Reportar a ${reportedUserName}`}>
      <div className="flex flex-col gap-4">
        <Select
          label="Motivo"
          options={REASON_OPTIONS}
          value={reason}
          onChange={(event) => setReason(event.target.value as Tables<"reports">["reason"])}
        />
        <Textarea
          label="Detalles (opcional)"
          rows={3}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />

        {submitReport.isError && (
          <p className="text-sm text-danger">No se pudo enviar el reporte. Inténtalo de nuevo.</p>
        )}
        {submitReport.isSuccess && (
          <p className="text-sm text-success">Reporte enviado. Gracias por avisarnos.</p>
        )}

        <Button onClick={handleSubmit} isLoading={submitReport.isPending}>
          Enviar reporte
        </Button>
      </div>
    </Modal>
  );
}
