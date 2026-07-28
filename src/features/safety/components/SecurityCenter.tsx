"use client";

import { Button, Card } from "@/components/ui";

import { useBlockedUsers, useUnblockUser } from "../hooks";

export function SecurityCenter({ userId }: { userId: string }) {
  const blockedUsers = useBlockedUsers(userId);
  const unblockUser = useUnblockUser(userId);

  if (!blockedUsers.data || blockedUsers.data.length === 0) {
    return (
      <Card className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
        No has bloqueado a ningún usuario.
      </Card>
    );
  }

  return (
    <Card className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {blockedUsers.data.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-900 dark:text-white">
            {user.first_name} {user.last_name}
          </span>
          <Button
            size="sm"
            variant="ghost"
            isLoading={unblockUser.isPending && unblockUser.variables === user.id}
            onClick={() => unblockUser.mutate(user.id)}
          >
            Desbloquear
          </Button>
        </div>
      ))}
    </Card>
  );
}
