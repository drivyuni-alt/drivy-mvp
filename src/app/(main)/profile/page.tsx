import { redirect } from "next/navigation";

import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return <ProfileScreen userId={currentUser.profile.id} />;
}
