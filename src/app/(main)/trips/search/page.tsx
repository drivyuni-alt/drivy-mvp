import { redirect } from "next/navigation";

import { SearchResultsScreen } from "@/features/trips/components/SearchResultsScreen";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

interface SearchPageProps {
  searchParams: Promise<{
    origin?: string;
    originLat?: string;
    originLng?: string;
    destination?: string;
    destinationLat?: string;
    destinationLng?: string;
    date?: string;
    time?: string;
  }>;
}

export default async function SearchTripsPage({ searchParams }: SearchPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const params = await searchParams;

  return (
    <SearchResultsScreen
      passengerId={currentUser.profile.id}
      initialParams={{
        originQuery: params.origin ?? "",
        originLat: params.originLat ? Number(params.originLat) : null,
        originLng: params.originLng ? Number(params.originLng) : null,
        destinationQuery: params.destination ?? "",
        destinationLat: params.destinationLat ? Number(params.destinationLat) : null,
        destinationLng: params.destinationLng ? Number(params.destinationLng) : null,
        date: params.date,
        time: params.time,
      }}
    />
  );
}
