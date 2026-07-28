import { redirect } from "next/navigation";

import { PublishTripForm } from "@/features/trips/components/PublishTripForm";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function NewTripPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Publicar viaje</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Comparte tu ruta y ahorra en cada trayecto.
      </p>

      <div className="mt-6">
        <PublishTripForm driverId={currentUser.profile.id} />
      </div>
    </div>
  );
}
