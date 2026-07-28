"use client";

import { useState } from "react";

import { Button } from "@/components/ui";

import { useBlockedUserIds, useBlockUser, useUnblockUser } from "../hooks";
import { ReportUserModal } from "./ReportUserModal";

export function SafetyActions({
  currentUserId,
  targetUserId,
  targetUserName,
  tripId,
}: {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  tripId: string | null;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const blockedIds = useBlockedUserIds(currentUserId);
  const blockUser = useBlockUser(currentUserId);
  const unblockUser = useUnblockUser(currentUserId);

  const isBlocked = blockedIds.data?.has(targetUserId) ?? false;

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" onClick={() => setReportOpen(true)}>
        Reportar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isLoading={blockUser.isPending || unblockUser.isPending}
        onClick={() =>
          isBlocked ? unblockUser.mutate(targetUserId) : blockUser.mutate(targetUserId)
        }
      >
        {isBlocked ? "Desbloquear" : "Bloquear"}
      </Button>

      <ReportUserModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reporterId={currentUserId}
        reportedUserId={targetUserId}
        reportedUserName={targetUserName}
        tripId={tripId}
      />
    </div>
  );
}
