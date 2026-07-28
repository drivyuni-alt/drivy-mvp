import { redirect } from "next/navigation";

import { NotificationList } from "@/features/notifications/components/NotificationList";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink-900 dark:text-white">Notificaciones</h1>
      <NotificationList userId={currentUser.profile.id} />
    </div>
  );
}
