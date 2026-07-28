import { redirect } from "next/navigation";

import { TripDetailScreen } from "@/features/trips/components/TripDetailScreen";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { id } = await params;

  return <TripDetailScreen tripId={id} currentUserId={currentUser.profile.id} />;
}
