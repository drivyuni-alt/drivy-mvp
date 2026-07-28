"use client";

import { Badge, Button, Card } from "@/components/ui";
import type { Tables } from "@/lib/supabase/types";

import { useVerifyUniversityEmail } from "../hooks";

export function VerificationCard({ profile }: { profile: Tables<"users"> }) {
  const verifyEmail = useVerifyUniversityEmail(profile.id);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Verificación</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-900 dark:text-white">Correo universitario</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {profile.university_email ?? "No añadido"}
          </p>
        </div>
        {profile.is_university_verified ? (
          <Badge variant="success">Verificado</Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            isLoading={verifyEmail.isPending}
            disabled={!profile.university_email}
            onClick={() => verifyEmail.mutate()}
          >
            Verificar
          </Button>
        )}
      </div>
      {verifyEmail.data === false && (
        <p className="text-xs text-danger">
          El dominio de tu correo no coincide con el de tu universidad.
        </p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-900 dark:text-white">Identidad</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Verificación de documento</p>
        </div>
        {profile.is_identity_verified ? (
          <Badge variant="success">Verificado</Badge>
        ) : (
          <Badge variant="neutral">Próximamente</Badge>
        )}
      </div>
    </Card>
  );
}
