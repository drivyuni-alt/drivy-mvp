import { redirect } from "next/navigation";

import { HomeScreen } from "@/features/trips/components/HomeScreen";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return <HomeScreen userId={currentUser.profile.id} firstName={currentUser.profile.first_name} />;
}
