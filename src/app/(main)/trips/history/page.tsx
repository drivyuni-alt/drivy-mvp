import { redirect } from "next/navigation";

import { TripHistoryScreen } from "@/features/trips/components/TripHistoryScreen";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function TripHistoryPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return <TripHistoryScreen userId={currentUser.profile.id} />;
}
