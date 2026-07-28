"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge, Card, CardContent, Skeleton, buttonVariants } from "@/components/ui";
import { useSignOut } from "@/features/auth/hooks";
import { AchievementGrid } from "@/features/gamification/components/AchievementGrid";
import { UniversityRankingList } from "@/features/gamification/components/UniversityRankingList";
import { SecurityCenter } from "@/features/safety/components/SecurityCenter";
import { VehicleList } from "@/features/vehicles/components/VehicleList";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useProfileDetails } from "../hooks";
import { EditProfileModal } from "./EditProfileModal";
import { ThemeSelector } from "./ThemeSelector";
import { VerificationCard } from "./VerificationCard";

export function ProfileScreen({ userId }: { userId: string }) {
  const profile = useProfileDetails(userId);
  const signOut = useSignOut();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  if (profile.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile.data) return null;

  const { profile: user, university, stats, vehicles } = profile.data;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            {user.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-ink-900 dark:text-white">
              {user.first_name} {user.last_name}
            </h1>
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
              {university?.name ?? "Sin universidad"} {user.degree && `· ${user.degree}`}
            </p>
            <p className="text-sm text-ink-900 dark:text-white">
              ⭐ {user.rating_avg.toFixed(1)} ({user.rating_count} valoraciones)
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {user.is_university_verified && <Badge variant="success">Universidad verificada</Badge>}
          {stats && <Badge variant="brand">Nivel {stats.level}</Badge>}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
          >
            Editar perfil
          </button>
          <Link href="/trips/history" className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>
            Mis viajes
          </Link>
        </div>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Viajes"
            value={String(stats.trips_as_driver + stats.trips_as_passenger)}
          />
          <StatTile label="Ahorrado" value={formatPrice(stats.money_saved_eur)} />
          <StatTile label="CO₂ ahorrado" value={`${stats.co2_saved_kg.toFixed(1)} kg`} />
          <StatTile label="Puntualidad" value={`${Math.round(stats.punctuality_score)}%`} />
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Logros</h2>
        <AchievementGrid userId={userId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">
          Ranking entre universidades
        </h2>
        <UniversityRankingList />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Vehículos</h2>
        <VehicleList userId={userId} vehicles={vehicles} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Métodos de pago</h2>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-white">Efectivo</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Los pagos con tarjeta (Stripe) llegarán próximamente.
              </p>
            </div>
            <Badge variant="neutral">Por defecto</Badge>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Seguridad</h2>
        <div className="flex flex-col gap-3">
          <VerificationCard profile={user} />
          <div>
            <p className="mb-2 text-sm font-medium text-ink-900 dark:text-white">
              Usuarios bloqueados
            </p>
            <SecurityCenter userId={userId} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Preferencias</h2>
        <Card className="p-4">
          <p className="mb-2 text-sm font-medium text-ink-900 dark:text-white">Tema</p>
          <ThemeSelector />
        </Card>
      </section>

      <button
        type="button"
        onClick={() => signOut.mutate(undefined, { onSuccess: () => router.push("/login") })}
        className={buttonVariants({ variant: "outline" })}
      >
        Cerrar sesión
      </button>

      <EditProfileModal profile={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-lg font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </Card>
  );
}
